import { Level } from "./LevelPhase";
import { Briefing } from "./BriefingPhase";
import { GameState, Phase } from "../game/game";
import { EndGame } from "./EndGame";
import { Shop } from "./ShopPhase";

function ExitPhase(state: GameState) {
	const phase = state.level.phase;
	switch (phase) {
		case Phase.Briefing:
			Briefing.Exit(state);
			break;
		case Phase.Level:
			Level.Exit(state);
			break;
		case Phase.Shop:
			Shop.Exit(state);
			break;
		case Phase.Victory:
		case Phase.Defeat:
			EndGame.Exit(state);
			break;
	}
}

function EnterPhase(state: GameState) {
	const phase = state.level.phase;
	switch (phase) {
		case Phase.Briefing:
			Briefing.Enter(state);
			break;
		case Phase.Level:
			Level.Enter(state);
			break;
		case Phase.Shop:
			Shop.Enter(state);
			break;
		case Phase.Victory:
		case Phase.Defeat:
			EndGame.Enter(state);
			break;
	}
}
function Run(state: GameState, dt: number) {
	const phase = state.level.phase;
	switch (phase) {
		case Phase.Briefing:
			Briefing.Run(state, dt);
			break;
		case Phase.Level:
			Level.Run(state, dt);
			break;
		case Phase.Shop:
			Shop.Run(state, dt);
			break;
		case Phase.Victory:
			EndGame.Run(state, dt);
			break;
		case Phase.Defeat:
			EndGame.Run(state, dt);
			break;
	}
}

export module Phases {
	export function SetPhase(state: GameState, phase: Phase) {
		ExitPhase(state);
		state.level.phase = phase;
		EnterPhase(state);
	}

	export function RunPhase(state: GameState, dt: number) {
		Run(state, dt);
	}
}