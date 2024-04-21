import { GameState, Phase, Systems } from "../game/game";
import { GlobalGameParameters } from "../game/static";
import { Phases } from "./Phases";

export module Briefing {
	export function Enter(state: GameState) {
		state.level.progress = 0;
		for (var pid in state.players) {
			const playerData = state.players[pid];
			Systems.player.levelTransition(playerData);
		}
	}

	export function Exit(state: GameState) {

	}

	export function Run(state: GameState, dt: number) {
		if (state.level.progress >= 2000) {
			Phases.SetPhase(state, Phase.Level);
			return;
		}

		state.level.progress += dt;

		const p = state.level.progress / 1000;
		const prog = (p*p*p) * 250;
		for (const pid in state.players) {
			const playerData = state.players[pid];
			const targetPos = GlobalGameParameters.GetStartPosition(playerData.idx);

			const yOffset = Math.max(200 - prog, 0);
			state.players[pid].transform.position = { x: targetPos.x, y: Math.floor(targetPos.y + yOffset) };
		}
	}
}
