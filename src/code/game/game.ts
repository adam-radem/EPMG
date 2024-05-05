import { PlayerId } from "rune-games-sdk";
import { PlayerEntityData } from "../entity/player";
import { GlobalGameParameters } from "./static";
import { EnemySystem, EnemyEntityData, Path } from "../entity/enemy";
import { GetShipType, SetSlot, ShipSlot, Ships, WeaponProjectileData } from "../types/shipdata";
import { V2, Vector2 } from "../math/vector";
import { EquipData, EquipSystem } from "../entity/equip";
import { ProjectileData } from "../entity/projectile";
import { GetShipData } from "../databases/shipdatabase";
import { CircBody } from "../entity/transform";
import { Screen } from "../rendering/screen";
import { GetEquipmentData } from "../databases/equipdatabase";
import { DropEntityData } from "../entity/drop";
import { Phases } from "../phases/Phases";

export enum Phase {
	None,
	Briefing,
	Level,
	Shop,
	Victory,
	Defeat
}

export enum TeamId {
	Player = 1,
	Enemy = 2,
	Both = 3,
	Neither = 0
}

export function NextEntityId(state: GameState) { return ++state.entityCount; };
export function Destroy(state: GameState, entity: EntityId) { state.removed.push(entity); }
export function UpdateGameState(state: GameState, allPlayerIds: PlayerId[]) {
	const dt = 33;
	state.time = Rune.gameTime();

	Phases.RunPhase(state, dt);
}

export function EquipPlayer(state: GameState, playerId: string, equip: number, slot: ShipSlot) {
	const equipData = GetEquipmentData(equip);
	if ((equipData.slot & slot) !== 0) {
		const playerData = state.players[playerId];
		playerData.shipData = SetSlot(playerData.shipData, slot, equip);
		EquipSystem.CreateEquipment(equipData, playerId, state);
	}
}

export function CreatePlayer(state: GameState, playerId: string) {
	const assignedPlayers = [];
	for (const pid in state.players) {
		assignedPlayers.push(state.players[pid].idx);
	}
	let idx = 0;
	for (; idx < 4; ++idx) {
		if (assignedPlayers.indexOf(idx) < 0)
			break;
	}

	const ship = 0;//Ships.Players[0] + idx;
	const startPos = GlobalGameParameters.GetStartPosition(idx);
	const yPosOffscreen = Screen.PlayableArea.y + 200;
	const player: PlayerEntityData = {
		id: playerId,
		idx: idx,
		shipData: ship,
		transform: {
			position: Vector2.makeVector(startPos.x, yPosOffscreen),
			angle: 180,
			scale: 1
		},
		collider: { center: Vector2.zero(), radius: 1 },
		target: Vector2.zero(),
		health: 0,
		maxHealth: 0,
		speed: 0,
		auras: []
	};
	state.players[playerId] = player;
	state.scores[playerId] = 0;
	return player;
}

export function SetPlayerShip(state: GameState, playerId: string, shipID: number) {
	const playerData = state.players[playerId];
	const ship = Ships.Players[shipID] + playerData.idx;
	const shipData = GetShipData(GetShipType(ship));

	playerData.shipData = ship;
	playerData.collider = (shipData.collider as CircBody);
	playerData.maxHealth = playerData.health = shipData.baseHealth!;
	playerData.speed = shipData.speed!;

	console.log(`Player ${playerData.idx} has chosen ${ship}`);
	state.players[playerId] = playerData;

	EquipPlayer(state, playerId, shipData.defaultWeapon!, ShipSlot.Front);
}

export function DeletePlayer(state: GameState, playerId: string) {
	delete state.players[playerId];
	delete state.scores[playerId];
}

export function NewGameState(allPlayerIds: string[]): GameState {
	const state: GameState = {
		level: {
			phase: Phase.None,
			id: 0,
			seed: Math.floor(Math.random() * 65535),
			eventIdx: 0,
			progress: 0,
			startTime: 0,
			ready: 1
		},
		entityCount: 0,
		time: 0,
		scores: {},
		players: {},
		enemies: {},
		enemyPathData: {},
		equipment: {},
		projectiles: {},
		drops: {},
		removed: []
	};

	let cnt = 0;
	for (let playerId of allPlayerIds) {
		if (!playerId) //Spectator playerIds are null
			continue;
		CreatePlayer(state, playerId);
		++cnt;
	}

	for (var i = 0; i != 4; ++i) {
		CreateRandomPath(state);
	}
	CreateAsteroidPaths(state);

	console.log(`Game has been initialized with ${allPlayerIds.length} players`);
	return state;
}

function CreateRandomPath(state: GameState) {
	const pathPoints: V2[] = [];
	let x = 0, y = 0;
	const inv = Math.random() < 0.5;
	for (let i = 0; i != 9; ++i) {
		//left = 0, middle = 1, right = 2
		x = (i % 3) / 2 * (Screen.PlayableArea.x + 200) - 100;
		if (inv)
			x = Screen.PlayableArea.x - x;

		//every 3 i values = 200 pixels less
		y = Math.floor(i / 3) * (Screen.PlayableArea.y - 200) / 2 + (Math.random() * 400);

		pathPoints.push({ x: x, y: y });
	}

	EnemySystem.CreatePath(state, pathPoints);
}

function CreateAsteroidPaths(state: GameState) {
	const yStart = -100;
	const yMid = Screen.PlayableArea.y / 2;
	const yEnd = Screen.PlayableArea.y + 100;

	//2 straight quadrant paths
	const quadScreenX = Screen.PlayableArea.x / 4;
	const halfScreenX = Screen.PlayableArea.x / 2;
	for (let i = 0; i < 2; ++i) {
		const xStart = (halfScreenX * i) + Math.random() * quadScreenX + (quadScreenX * i);
		const xEnd = (halfScreenX * i) + Math.random() * quadScreenX + (quadScreenX * i);

		EnemySystem.CreatePath(state, [{ x: xStart, y: yStart }, { x: xEnd, y: yEnd }]);
	}

	//4 diagonal paths Q1 -> Q3, Q2-> Q4, Q3 -> Q1, Q4 -> Q2 
	for (let i = 0; i < 4; ++i) {
		const iEnd = (i + 2) % 4;

		const xStart = (quadScreenX * i) + Math.random() * quadScreenX / 2 + quadScreenX / 3;
		const xEnd = (quadScreenX * iEnd) + Math.random() * quadScreenX / 2 + quadScreenX / 3;

		EnemySystem.CreatePath(state, [{ x: xStart, y: yStart }, { x: xEnd, y: yEnd }]);
	}

	//3 curved paths Q1 -> Q1, etc
	for (let i = 0; i < 3; ++i) {
		const xStart = (quadScreenX * i) + Math.random() * quadScreenX + (quadScreenX / 3 * i);
		const xEnd = (quadScreenX * i) + Math.random() * quadScreenX + (quadScreenX / 3 * i);
		const xMid = quadScreenX / 2 + Math.random() * quadScreenX * 3;

		EnemySystem.CreatePath(state, [{ x: xStart, y: yStart }, { x: xMid, y: yMid }, { x: xEnd, y: yEnd }]);
	}
}

export interface GameLevelState {
	phase: Phase;
	seed: number;
	id: number;
	eventIdx: number;
	progress: number;
	startTime: number;
	ready: number;
}

export interface GameState {
	time: number;
	level: GameLevelState;
	entityCount: number;
	scores: Record<PlayerId, number>;
	players: Record<PlayerId, PlayerEntityData>;
	enemies: Record<EntityId, EnemyEntityData>;
	equipment: Record<EntityId, EquipData>;
	projectiles: Record<EntityId, ProjectileData>;
	drops: Record<EntityId, DropEntityData>;
	enemyPathData: Record<number, Path>;
	removed: EntityId[];
}