import "./index.css";
import { GameClient } from "./client";
import { Keyboard } from "./code/input/keyboard";
import * as Renderer from "./code/rendering/renderer";

const client = new GameClient();

Renderer.Init().then(() => {
	client.registerInput();
	Dusk.initClient({
		onChange: (params) => {
			Renderer.updateLevelParameters(params.game);
			client.updateState(params.game, params.allPlayerIds, params.yourPlayerId);
		}
	});
});


export module Callbacks {
	export const FooterButtonPressed = (event: Event, idx: number) => {
		client.footerButtonPressed(idx);
		event.stopPropagation();
		event.preventDefault();
		return false;
	};

	export const ShipSelected = (event: Event, idx: number) => {
		client.shipSelected(idx);
		event.stopPropagation();
		event.preventDefault();
		return false;
	};
}