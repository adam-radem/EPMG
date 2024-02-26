import "./index.css";
import { GameClient } from "./client";

var client = new GameClient();

Rune.initClient({
	onChange: (params) => {
		client.updateState(params.game);
	}
});