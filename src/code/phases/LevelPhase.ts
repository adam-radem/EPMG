import { AddScoreToPlayer, Destroy, GameState, Phase } from "../game/game";
import { GlobalGameParameters } from "../game/static";
import { LevelRunner } from "../level/timeline";
import { Vector2 } from "../math/vector";
import { Phases } from "./Phases";
import { PlayerSystem } from "../entity/player";
import { EquipSystem } from "../entity/equip";
import { ProjectileSystem } from "../entity/projectile";
import { EnemySystem } from "../entity/enemy";
import { AuraSystem } from "../aura/aura";
import { CollisionSystem } from "../game/collision";
import { AbilitySystem } from "../aura/ability";

const runner: LevelRunner = new LevelRunner();

export function RunGamePhase(state: GameState, dt: number) {
	//Advance level state
	runner.Run(state, dt);

	//Update player state first
	for (const playerId in state.players) {
		const abilityData = state.playerAbilities[playerId];
		AbilitySystem.onUpdate(abilityData, state, dt);

		const playerData = state.players[playerId];
		PlayerSystem.onUpdate(playerData, state, dt);
	}

	//Then update enemies
	for (const enemyId in state.enemies) {
		const enemyData = state.enemies[enemyId];
		EnemySystem.onUpdate(enemyData, state, dt);
	}

	//Update weapons to fire new projectiles
	for (const weaponId in state.equipment) {
		const weaponData = state.equipment[weaponId];
		EquipSystem.onUpdate(weaponData, state, dt);
	}

	//Then update the projectile state
	for (const projectileId in state.projectiles) {
		const projectileData = state.projectiles[projectileId];
		ProjectileSystem.onUpdate(projectileData, state, dt);
	}

	while (state.scoreDrops.length > 0 && state.scoreDrops[0].expires < state.time)
		state.scoreDrops.shift();

	CollisionSystem.onUpdate(state);

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
	const removedEntities = state.removed;
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
		else if (id in state.drops)
			delete state.drops[id];
	}
	state.removed.length = 0;
}

export module Level {
	export function Enter(state: GameState) {
		state.level.id += 1;
		state.level.progress = 0;
		state.level.eventIdx = 0;
		state.level.seed = Math.floor(Math.random() * 65535);

		state.scoreDrops.length = 0;

		for (const pid in state.players) {
			const playerData = state.players[pid];

			//Reset players to the starting position
			const pos = GlobalGameParameters.GetStartPosition(playerData.idx);
			playerData.transform.position = pos;

			playerData.transform.angle = 180;
			playerData.target = Vector2.zero();
		}
	}
	export function Exit(state: GameState) {
		for (const pid in state.projectiles) {
			Destroy(state, pid);
		}

		for (const did in state.drops) {
			Destroy(state, did);
		}

		Cleanup(state);
	}

	export function Run(state: GameState, dt: number): void { RunGamePhase(state, dt); }
}