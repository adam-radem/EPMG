import { GameState, Phase } from "../game/game";

export module EndGame {
	export function Enter(state: GameState) {
		state.level.progress = 0;
	}

	export function Exit(state: GameState) {

	}

	export function Run(state: GameState, dt: number) {
		state.level.progress += dt;
		if (state.level.progress > 2500) {
			//defeat state
			if (state.level.phase == Phase.Defeat) {
				Rune.gameOver({
					everyone: "LOST"
				});
				return;
			}

			Rune.gameOver({
				players: state.scores
			});
		}
	}
}