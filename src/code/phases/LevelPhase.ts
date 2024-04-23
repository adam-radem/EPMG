import { GameState, Phase, Systems } from "../game/game";
import { GlobalGameParameters } from "../game/static";
import { LevelRunner } from "../level/timeline";
import { Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { Phases } from "./Phases";

const removedEntities: EntityId[] = [];
const runner: LevelRunner = new LevelRunner();

export function Destroy(entity: EntityId) { removedEntities.push(entity); }

export function RunGamePhase(state: GameState, dt: number) {
	//Advance level state
	runner.Run(state, dt);

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

	CheckGameOver(state);
}

function CheckGameOver(state: GameState) {
	for (const pid in state.players) {
		if (state.players[pid].health > 0)
			return;
	}

	Phases.SetPhase(state, Phase.Defeat);
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

export module Level {
	export function Enter(state: GameState) {
		state.level.id += 1;
		state.level.progress = 0;
		state.level.eventIdx = 0;
		state.level.seed = Math.floor(Math.random() * 65535);

		for (const pid in state.players) {
			const playerData = state.players[pid];

			//Reset players to the starting position
			const pos = GlobalGameParameters.GetStartPosition(playerData.idx);
			playerData.transform.position = pos;

			playerData.transform.angle = 180;
			playerData.target = Vector2.zero();

			//If players are damaged, heal them as far as half-health
			if (playerData.health < playerData.maxHealth / 2) {
				playerData.health = playerData.maxHealth / 2;
			}

		}
	}
	export function Exit(state: GameState) {
		for (const pid in state.projectiles) {
			Destroy(pid);
		}
	}

	export function Run(state: GameState, dt: number): void { RunGamePhase(state, dt); }
	export function DestroyGameEntity(id: EntityId): void { Destroy(id); }
}