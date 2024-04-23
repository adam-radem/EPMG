import { GameState, Phase, Systems, SetPlayerShip } from "../game/game";
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
		if (state.time > GlobalGameParameters.MaxShoppingTime) {
			for (const pid in state.players) {
				const playerData = state.players[pid];
				if (playerData.shipData === 0) {
					const randomShip = Math.floor(Math.random() * 3);
					SetPlayerShip(state, pid, randomShip);
				}
			}
		}

		let allReady = true;
		for (const pid in state.players) {
			const playerData = state.players[pid];
			if (playerData.shipData === 0) {
				allReady = false;
				continue;
			}
			const targetPos = GlobalGameParameters.GetStartPosition(playerData.idx);
			let yPos = playerData.transform.position.y;
			if (Math.abs(playerData.transform.position.y - targetPos.y) > 1) {
				yPos = yPos - (yPos - targetPos.y) / 8;
				playerData.transform.position = { x: playerData.transform.position.x, y: yPos };
				allReady = false;
			}
		}

		if (!allReady)
			return;

		state.level.progress += dt;

		if (state.level.progress >= 2000) {
			Phases.SetPhase(state, Phase.Level);
			return;
		}

	}
}
