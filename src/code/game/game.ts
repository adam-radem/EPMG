import { PlayerId } from "rune-games-sdk";
import { PlayerSystem, PlayerEntityData } from "../entity/player";
import { GlobalGameParameters } from "./static";
import { EnemySystem, EnemyEntityData, Path } from "../entity/enemy";
import { Ships } from "../types/shipdata";
import { Vector2 } from "../math/vector";
import { WeaponData, WeaponSystem } from "../entity/weapon";
import { ProjectileData, ProjectileSystem } from "../entity/projectile";
import { GetShipData } from "../databases/shipdatabase";
import { RectBody } from "../entity/transform";
import { Screen } from "../rendering/screen";

export enum Phase {
	Briefing,
	Game,
	Shop,
	Victory,
	Defeat
}

const playerSystem = new PlayerSystem();
const enemySystem = new EnemySystem();
const weaponSystem = new WeaponSystem();
const projectileSystem = new ProjectileSystem();

const removedEntities: EntityId[] = [];

export function NextEntityId(state: GameState) { return ++state.entityCount; };
export function Destroy(entity: EntityId) { removedEntities.push(entity); }

export function UpdateGameState(state: GameState, allPlayerIds: PlayerId[]) {
	const dt = Rune.gameTime() - state.time;
	state.time = Rune.gameTime();

	//Update player state first
	for (const playerId in state.players) {
		const playerData = state.players[playerId];
		playerSystem.onUpdate(playerData, state, dt);
	}

	//Then update enemies
	for (const enemyId in state.enemies) {
		const enemyData = state.enemies[enemyId];
		enemySystem.onUpdate(enemyData, state, dt);
	}

	for (const weaponId in state.weapons) {
		const weaponData = state.weapons[weaponId];
		weaponSystem.onUpdate(weaponData, state, dt);
	}

	for (const projectileId in state.projectiles) {
		const projectileData = state.projectiles[projectileId];
		projectileSystem.onUpdate(projectileData, state, dt);
	}

	const destroyed = {
		players: removedEntities.filter(id => state.players[id]),
		enemies: removedEntities.filter(id => state.enemies[id]),
		weapons: removedEntities.filter(id => state.weapons[id]),
		projectiles: removedEntities.filter(id => state.projectiles[id])
	};

	for (const id of destroyed.players) {
		console.log(`Deleted player ${id}`);
		delete state.players[id];
	}
	for (const id of destroyed.enemies) {
		console.log(`Deleted enemy ${id}`);
		delete state.enemies[id];
	}
	for (const id of destroyed.weapons) {
		console.log(`Deleted weapon ${id}`);
		delete state.weapons[id];
	}
	for (const id of destroyed.projectiles) {
		console.log(`Deleted projectile ${id}`);
		delete state.projectiles[id];
	}

	removedEntities.length = 0;
}

export function CreatePlayer(state: GameState, playerId: string) {
	const assignedPlayers = [];
	for (const pid in state.players) {
		assignedPlayers.push(state.players[pid].idx);
	}
	let idx = 0;
	for (; idx < 4; ++idx) {
		if(assignedPlayers.indexOf(idx) < 0)
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
			angle: 0,
			scale: 1
		},
		collider: (shipData.collider as RectBody),
		target: Vector2.zero(),
		health: shipData.baseHealth!,
		maxHealth: shipData.baseHealth!
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
		weapons: {},
		projectiles: {}
	};

	let cnt = 0;
	for (let playerId of allPlayerIds) {
		if (!playerId) //Spectator playerIds are null
			continue;
		CreatePlayer(state, playerId);
		++cnt;
	}

	const thirdWidth = Screen.PlayableArea.x / 3;

	const p0 = { x: Screen.PlayableArea.x + 100, y: Math.random() * 500 + 350 };
	const p1 = { x: Math.random() * thirdWidth + thirdWidth, y: Math.random() * 400 + 400 };
	const p2 = { x: -100, y: Math.random() * 500 + 350 };

	const pathPoints = [p0, p1, p2];
	const reversed = [p2, p1, p0];

	const path = EnemySystem.CreatePath(state, pathPoints);
	EnemySystem.CreateEnemy(Ships.Enemies[0], path, state);

	const reversedPath = EnemySystem.CreatePath(state, reversed);
	EnemySystem.CreateEnemy(Ships.Enemies[0], reversedPath, state);

	console.log(`Game has been initialized with ${allPlayerIds.length} players`);
	return state;
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
	weapons: Record<EntityId, WeaponData>;
	projectiles: Record<EntityId, ProjectileData>;
}