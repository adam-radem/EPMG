import "./index.css";
import { GameClient } from "./client";
import { Keyboard } from "./code/input/keyboard";
import * as Renderer from "./code/rendering/renderer";

const client = new GameClient();

Renderer.Init().then(() => {
	const keyboard = new Keyboard();
	client.registerInput(keyboard);
	Rune.initClient({
		onChange: (params) => {
			Renderer.updateLevelParameters(params.game);
			client.updateState(params.game, params.allPlayerIds, params.yourPlayerId);
		}
	});
});


export module Callbacks {
	export const FooterButtonPressed = (event:Event, idx: number) => {
		client.footerButtonPressed(idx);
		event.stopPropagation();
		event.preventDefault();
		return false;
	};
}