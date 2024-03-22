import "./index.css";
import { GameClient } from "./client";
import { Keyboard } from "./code/input/keyboard";
import * as Renderer from "./code/rendering/renderer";

const client = new GameClient();

const keyboard = new Keyboard();
client.registerInput(keyboard);

Renderer.Init().then(() => {
	Rune.initClient({
		onChange: (params) => {
			Renderer.updateLevelParameters(params.game);
			client.updateState(params.game, params.allPlayerIds, params.yourPlayerId);
		}
	});
});


export module Callbacks {
	export const FooterButtonPressed = (idx: number) => {
		client.footerButtonPressed(idx);
	};
}