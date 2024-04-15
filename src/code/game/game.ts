import { PlayerId } from "rune-games-sdk";
import { PlayerSystem, PlayerEntityData, isPlayer } from "../entity/player";
import { GlobalGameParameters } from "./static";
import { EnemySystem, EnemyEntityData, Path } from "../entity/enemy";
import { ShipSlot, Ships, WeaponProjectileData } from "../types/shipdata";
import { V2, Vector2 } from "../math/vector";
import { EquipData, EquipSystem } from "../entity/equip";
import { ProjectileData, ProjectileSystem } from "../entity/projectile";
import { GetShipData } from "../databases/shipdatabase";
import { CircBody, RectBody } from "../entity/transform";
import { Screen } from "../rendering/screen";
import { GetEquipmentData } from "../databases/equipdatabase";
import { CollisionSystem } from "./collision";
import { Aura, AuraSystem } from "../aura/aura";

export enum Phase {
	Briefing,
	Game,
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

class SystemSet {
	player: PlayerSystem;
	enemy: EnemySystem;
	equip: EquipSystem;
	projectile: ProjectileSystem;
	collision: CollisionSystem;
	aura: AuraSystem;

	public constructor() {
		this.player = new PlayerSystem();
		this.enemy = new EnemySystem();
		this.equip = new EquipSystem();
		this.projectile = new ProjectileSystem();
		this.collision = new CollisionSystem();
		this.aura = new AuraSystem();
	}
}

export const Systems: SystemSet = new SystemSet();

const removedEntities: EntityId[] = [];

export function NextEntityId(state: GameState) { return ++state.entityCount; };
export function Destroy(entity: EntityId) { removedEntities.push(entity); }

export function UpdateGameState(state: GameState, allPlayerIds: PlayerId[]) {
	const dt = Rune.gameTime() - state.time;
	state.time = Rune.gameTime();

	//TEMP -- spawn some enemies to play with in waves
	if (state.time % 8000 <= 3000) {
		if (Math.floor(state.time / 750) > state.level.progress) {
			EnemySystem.CreateEnemy(Ships.Enemies[0], state);
			state.level.progress = Math.floor(state.time / 750);
		}
	}

	//Update player state first
	for (const playerId in state.players) {
		const playerData = state.players[playerId];
		Systems.player.onUpdate(playerData, state, dt);
	}

	//Then update enemies
	for (const enemyId in state.enemies) {
		const enemyData = state.enemies[enemyId];
		Systems.enemy.onUpdate(enemyData, state, dt);
	}

	//Update weapons to fire new projectiles
	for (const weaponId in state.equipment) {
		const weaponData = state.equipment[weaponId];
		Systems.equip.onUpdate(weaponData, state, dt);
	}

	//Then update the projectile state
	for (const projectileId in state.projectiles) {
		const projectileData = state.projectiles[projectileId];
		Systems.projectile.onUpdate(projectileData, state, dt);
	}

	//Update global aura state
	for (const auraId in state.auras) {
		const auraData = state.auras[auraId];
		Systems.aura.onUpdate(auraData, state, dt);
	}

	Systems.collision.onUpdate(state);

	Cleanup(state);
}

function Cleanup(state: GameState) {
	//Cleanup all entities that were destroyed this frame
	for (const id of removedEntities) {
		if (id in state.players)
			delete state.players[id];
		else if (id in state.enemies)
			delete state.enemies[id];
		else if (id in state.equipment)
			delete state.equipment[id];
		else if (id in state.projectiles)
			delete state.projectiles[id];
		else if (id in state.auras)
			delete state.auras[id];
	}
	removedEntities.length = 0;
}

export function CreateProjectile(proj: WeaponProjectileData, position: V2, target: EntityId, owner: EntityId, state: GameState) {
	Systems.projectile.CreateProjectile(proj, position, target, owner, state);
}

export function EquipPlayer(state: GameState, playerId: string, equip: number, slot: ShipSlot) {
	const equipData = GetEquipmentData(equip);
	if ((equipData.slot & slot) !== 0) {
		const playerData = state.players[playerId];
		playerData.shipData.SetSlot(slot, equip);

		Systems.equip.CreateEquipment(equipData, playerId, state);
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

	const ship = Ships.Players[0] + idx;
	const shipData = GetShipData(ship.GetShipType());
	const player: PlayerEntityData = {
		id: playerId,
		idx: idx,
		shipData: ship,
		transform: {
			position: GlobalGameParameters.GetStartPosition(idx),
			angle: 180,
			scale: 1
		},
		collider: (shipData.collider as CircBody),
		target: Vector2.zero(),
		health: shipData.baseHealth!,
		maxHealth: shipData.baseHealth!,
		speed: shipData.speed!
	};
	state.players[playerId] = player;
	state.scores[playerId] = 0;
	return player;
}

export function DeletePlayer(state: GameState, playerId: string) {
	delete state.players[playerId];
	delete state.scores[playerId];
}

export function NewGameState(allPlayerIds: string[]): GameState {
	const state: GameState = {
		level: {
			phase: Phase.Game,
			id: 0,
			seed: Math.floor(Math.random() * 65535),
			segment: 0,
			progress: 0,
		},
		entityCount: 0,
		time: 0,
		scores: {},
		players: {},
		enemies: {},
		enemyPathData: {},
		equipment: {},
		projectiles: {},
		auras: {}
	};

	let cnt = 0;
	for (let playerId of allPlayerIds) {
		if (!playerId) //Spectator playerIds are null
			continue;
		CreatePlayer(state, playerId);
		EquipPlayer(state, playerId, 1, ShipSlot.Left);
		++cnt;
	}

	for (var i = 0; i != 5; ++i) {
		CreateRandomPath(state);
	}

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
		y = Math.floor(i / 3) * (Screen.PlayableArea.y - 200) / 2 + (Math.random() * 300 - 100) + 100;

		pathPoints.push({ x: x, y: y });
	}

	EnemySystem.CreatePath(state, pathPoints);
}

export interface GameLevelState {
	phase: Phase;
	seed: number;
	id: number;
	segment: number;
	progress: number;
}

export interface GameState {
	level: GameLevelState;
	time: number;
	entityCount: number;
	scores: Record<PlayerId, number>;
	players: Record<PlayerId, PlayerEntityData>;
	enemies: Record<EntityId, EnemyEntityData>;
	enemyPathData: Record<number, Path>;
	equipment: Record<EntityId, EquipData>;
	projectiles: Record<EntityId, ProjectileData>;
	auras: Record<EntityId, Aura>;
}