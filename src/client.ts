import { Players } from "rune-games-sdk";
import { GameState } from "./code/game/game";
import * as UI from './code/ui/UIController';
import { Keyboard, KeyState } from "./code/input/keyboard";

export class GameClient {

	public registerInput(keyboard: Keyboard) {
		//debug keys
		const pressedKey = (event: KeyboardEvent) => {
			const map:Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4 };
			const idx = map[event.key];
			if(idx && idx >= 0){
				const footer = UI.GetFooterElement(idx - 1);
				if(footer){
					footer.setData({ cooldown: idx, icon: '' });
					footer.setVisible(!footer.isVisible());
					UI.UpdateFooterPositions();
				}
			}
		};
		keyboard.subscribe(KeyState.KeyDown, pressedKey);
	}

	public footerButtonPressed(idx: number) {
		const footer = UI.GetFooterElement(idx - 1);
		footer?.buttonPressed();
		console.log(`Button ${idx} was pressed`);
	}

	public updatePlayers(players: Players) {
		let idx = 0;
		let spectatorCount = 0;
		for (const player in players) {
			const playerData = players[player];
			if (playerData.playerId) {
				const playerHeaderElement = UI.GetHeaderElement(idx);
				if (playerHeaderElement) {
					playerHeaderElement.setData(playerData);
					playerHeaderElement.setVisible(true);
				}
				++idx;
			}
			++spectatorCount;
		}
	}

	public updateState(state: GameState) {
	}
}