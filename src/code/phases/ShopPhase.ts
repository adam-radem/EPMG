import { GameState, Phase } from "../game/game";
import { GlobalGameParameters } from "../game/static";
import { Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { Phases } from "./Phases";

export module Shop {
	export function Enter(state: GameState) {
		state.level.progress = 0;

		for (const pid in state.players) {
			const playerData = state.players[pid];
			playerData.target = Vector2.zero();
			playerData.transform.angle = 180;

			//If players are damaged, heal them as far as half-health
			if (playerData.health < playerData.maxHealth / 2) {
				playerData.health = playerData.maxHealth / 2;
			}
		}
	}

	export function Exit(state: GameState) {
		for (const pid in state.players) {
			const playerData = state.players[pid];
			const startPos = GlobalGameParameters.GetStartPosition(playerData.idx);
			startPos.y = Screen.PlayableArea.y + 200;
			playerData.transform.position = startPos;
		}
	}

	export function Run(state: GameState, dt: number) {
		state.level.progress += dt;
		const p = state.level.progress / 1000;
		const speedMod = (p * p * p) * 10;
		for (const pid in state.players) {
			const playerData = state.players[pid];
			const pos = playerData.transform.position;
			playerData.transform.position = { x: pos.x, y: pos.y - (playerData.speed * speedMod * dt / 1000) };
		}

		if (state.level.progress >= 5000) {
			Phases.SetPhase(state, Phase.Briefing);
		}
	}
}