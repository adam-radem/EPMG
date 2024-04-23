import type { RuneClient } from "rune-games-sdk/multiplayer";
import { GameActions } from "./code/game/actions";
import * as Game from "./code/game/game";
import { GlobalGameParameters } from "./code/game/static";

declare global {
	const Rune: RuneClient<Game.GameState, GameActions>;
}

Rune.initLogic({
	minPlayers: 1,
	maxPlayers: 4,
	updatesPerSecond: 30,
	setup: (allPlayerIds: string[]) => {
		return Game.NewGameState(allPlayerIds);
	},
	actions: {
		setShip: ({ id }, { game, playerId }) => {
			if (game.level.phase !== Game.Phase.Briefing)
				throw Rune.invalidAction();
			
			if(game.players[playerId].shipData > 0)
				throw Rune.invalidAction();

			Game.SetPlayerShip(game, playerId, id);
		},
		setTarget: ({ newTarget }, { game, playerId }) => {
			if (game.level.phase !== Game.Phase.Level)
				throw Rune.invalidAction();

			const playerData = game.players[playerId];
			playerData.target = newTarget;
		},
		endScene: ({ }, { game }) => {
			game.level.progress = 0;
			switch (game.level.phase) {
				case Game.Phase.Briefing:
					game.level.phase = Game.Phase.Level;
					break;
				case Game.Phase.Level:
					if (game.level.id + 1 < GlobalGameParameters.GameLevelCount) {
						game.level.phase = Game.Phase.Shop;
					}
					else {
						game.level.phase = Game.Phase.Victory;
					}
					break;
				case Game.Phase.Shop:
					game.level.id += 1;
					game.level.phase = Game.Phase.Level;
					game.level.progress = 0;
					break;
			}
		}
	},
	update: ({ game, allPlayerIds }) => {
		Game.UpdateGameState(game, allPlayerIds);
	},
	events: {
		playerLeft: (playerId, eventContext) => {
			Game.DeletePlayer(eventContext.game, playerId);
		},
		playerJoined: (playerId, eventContext) => {
			console.log(`Player ${playerId} has joined...`);
			Game.CreatePlayer(eventContext.game, playerId);
		}
	}
});
