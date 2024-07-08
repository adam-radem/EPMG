import { PlayerId } from "dusk-games-sdk";
import { PlayerEntityData } from "../entity/player";
import { GlobalGameParameters } from "./static";
import { EnemySystem, EnemyEntityData, Path } from "../entity/enemy";
import { GetShipType, SetSlot, ShipSlot, Ships } from "../types/shipdata";
import { V2, Vector2 } from "../math/vector";
import { EquipData, EquipSystem } from "../entity/equip";
import { ProjectileData } from "../entity/projectile";
import { GetShipData } from "../databases/shipdatabase";
import { CircBody } from "../entity/transform";
import { Screen } from "../rendering/screen";
import { GetEquipmentData } from "../databases/equipdatabase";
import { DropEntityData } from "../entity/drop";
import { Phases } from "../phases/Phases";
import { Ability, AbilityData, AbilitySet } from "../databases/dropdatabase";
import { AbilitySystem } from "../aura/ability";

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
	state.time = Dusk.gameTime();

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

export function AddInitialPlayerAbility(state: GameState, playerId: string, abilityId: number) {
	const ability = AbilitySystem.createInitialAbility(abilityId, state);
	if (ability.id > 0)
		state.playerAbilities[playerId].abilities.push(ability);
}

export function AddPlayerAbility(state: GameState, playerId: string, data: Ability) {
	const playerAbilityList = state.playerAbilities[playerId].abilities;
	if (data && playerAbilityList.length < 4) {
		state.playerAbilities[playerId].abilities.push(data);
		return true;
	}
	return false;
}

export function ActivatePlayerAbility(state: GameState, playerId: string, id: number) {
	const playerAbilityList = state.playerAbilities[playerId].abilities;
	const idx = playerAbilityList.findIndex(x => x.id == id);
	const data = playerAbilityList[idx];
	if (data && data.cooldown <= 0 && data.charges != 0) {
		AbilitySystem.activate(state, playerId, data);
		if (data.charges == 0) {
			delete playerAbilityList[idx];
		}
		return true;
	}
	return false;
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

	const ship = 0;
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
	state.playerCount++;

	state.playerAbilities[playerId] = {
		abilities: []
	};
	return player;
}

export function SetPlayerShip(state: GameState, playerId: string, shipID: number) {
	const playerData = state.players[playerId];
	const ship = Ships.Players[shipID] + (playerData.idx << 4);
	const shipData = GetShipData(GetShipType(ship));

	playerData.shipData = ship;
	playerData.collider = (shipData.collider as CircBody);
	playerData.maxHealth = playerData.health = shipData.baseHealth!;
	playerData.speed = shipData.speed!;

	console.log(`Player ${playerData.idx} has chosen ${ship}`);
	state.players[playerId] = playerData;

	AddInitialPlayerAbility(state, playerId, shipData.ability || 0);
	EquipPlayer(state, playerId, shipData.weapon!, ShipSlot.Front);
}

export function DeletePlayer(state: GameState, playerId: string) {
	delete state.players[playerId];
	delete state.scores[playerId];
	state.playerCount--;
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
		pathCount: 0,
		playerCount: 0,
		scores: {},
		playerAbilities: {},
		players: {},
		enemies: {},
		enemyPathData: {},
		equipment: {},
		projectiles: {},
		drops: {},
		scoreDrops: [],
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
		CreateRandomPath(state, i);
	}

	console.log(`Game has been initialized with ${allPlayerIds.length} players`);
	return state;
}

export function AddScoreToPlayer(playerId: EntityId, scoreValue: number, position: V2, state: GameState) {
	if (playerId in state.scores) {
		state.scores[playerId] += scoreValue;
		state.scoreDrops.push({ player: playerId, value: scoreValue, position: position, expires: state.time + 2000 });
	}
}

function CreateRandomPath(state: GameState, idx: number) {
	const pathPoints: V2[] = [];
	const bounds = Screen.PlayableArea;
	const inv = (idx % 2 == 0);
	const yOffset = 100 * idx;
	const minWidth = bounds.x / 6;
	const maxWidth = bounds.x / 4;

	// enter top left
	pathPoints.push({ x: 80 + (Math.random() * maxWidth), y: -10 });
	//first waypoint - top right
	pathPoints.push({ x: (bounds.x - 80) - (Math.random() * minWidth), y: 50 + yOffset + (Math.random() * 200) });
	//second waypoint - middle left
	pathPoints.push({ x: 80 + (Math.random() * minWidth), y: 250 + yOffset + (Math.random() * 200) });
	//third waypoint - bottom right
	pathPoints.push({ x: (bounds.x - 80) - (Math.random() * minWidth), y: 550 + yOffset + (Math.random() * 200) });
	//exit bottom right
	pathPoints.push({ x: (bounds.x - 80) - (Math.random() * maxWidth), y: bounds.y + 50 });

	if (inv) {
		for (let i = 0; i != pathPoints.length; ++i) {
			pathPoints[i].x = bounds.x - pathPoints[i].x;
		}
	}

	EnemySystem.CreatePath(state, pathPoints);
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

export interface ScoreData {
	player: EntityId,
	value: number,
	position: V2,
	expires: number;
}

export interface GameState {
	time: number;
	level: GameLevelState;
	entityCount: number;
	scores: Record<PlayerId, number>;

	players: Record<PlayerId, PlayerEntityData>;
	playerCount: number;
	playerAbilities: Record<PlayerId, AbilitySet>;

	enemies: Record<EntityId, EnemyEntityData>;
	enemyPathData: Record<number, Path>;
	pathCount: number;

	drops: Record<EntityId, DropEntityData>;

	equipment: Record<EntityId, EquipData>;
	projectiles: Record<EntityId, ProjectileData>;

	scoreDrops: ScoreData[];
	removed: EntityId[];
}