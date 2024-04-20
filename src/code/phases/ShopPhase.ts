import { GameState, Phase, Systems } from "../game/game";
import { GlobalGameParameters } from "../game/static";
import { Vector2 } from "../math/vector";
import { Phases } from "./Phases";

export module Shop {
	export function Enter(state: GameState) {
		state.level.progress = 0;

		for (const pid in state.players) {
			const playerData = state.players[pid];
			playerData.target = Vector2.zero();
			playerData.transform.angle = 180;
		}
	}

	export function Exit(state: GameState) {

	}

	export function Run(state: GameState, dt: number) {
		state.level.progress += dt;

		for (const pid in state.players) {
			const playerData = state.players[pid];
			const pos = playerData.transform.position;
			playerData.transform.position = { x: pos.x, y: pos.y - (playerData.speed * dt / 1000) };
		}

		if (state.level.progress >= 5000) {
			Phases.SetPhase(state, Phase.Briefing);
		}
	}
}