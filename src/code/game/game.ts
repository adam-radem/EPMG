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

export function NextEntityId(state: GameState) { return ++state.entityCount; };

export function UpdateGameState(state: GameState, allPlayerIds: PlayerId[]) {
	const dt = Rune.gameTime() - state.time;
	state.time = Rune.gameTime();

	const destroyed = {
		players: [],
		enemies: [],
		weapons: [],
		projectiles: []
	};

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

	for (const id in destroyed.players) {
		delete state.players[id];
	}
	for (const id in destroyed.enemies) {
		delete state.enemies[id];
	}
	for (const id in destroyed.weapons) {
		delete state.weapons[id];
	}
	for (const id in destroyed.projectiles) {
		delete state.projectiles[id];
	}
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

	const livePlayers = allPlayerIds.filter(x => x);

	let cnt = 0;
	for (let playerId of allPlayerIds) {
		if (!playerId) //Spectator playerIds are null
			continue;

		const ship = Ships.Players[cnt] + Ships.RandomColor();
		const shipData = GetShipData(ship.GetShipType());
		const player: PlayerEntityData = {
			id: playerId,
			shipData: ship,
			transform: {
				position: GlobalGameParameters.GetStartPosition(cnt, livePlayers.length),
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

		++cnt;
	}

	const path = EnemySystem.CreatePath(state, [{ x: Screen.PlayableArea.x + 100, y: 360 }, { x: -100, y: 360 }]);
	EnemySystem.CreateEnemy(Ships.Enemies[0], path, state);

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