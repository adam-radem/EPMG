import type { RuneClient } from "rune-games-sdk/multiplayer";
import { GameActions } from "./code/game/actions";
import * as Game from "./code/game/game";
import { GlobalGameParameters } from "./code/game/static";

declare global {
	const Rune: RuneClient<Game.GameState, GameActions>;
}

Rune.initLogic({
	minPlayers: 1,
	maxPlayers: 2,
	updatesPerSecond: 30,
	setup: (allPlayerIds: string[]) => {
		return Game.NewGameState(allPlayerIds);
	},
	actions: {
		setTarget: ({ newTarget }, { game, playerId }) => {
			const playerData = game.players[playerId];
			playerData.target = newTarget;
		},
		endScene: ({ }, { game }) => {
			game.level.progress = 0;
			switch (game.level.phase) {
				case Game.Phase.Briefing:
					game.level.phase = Game.Phase.Game;
					break;
				case Game.Phase.Game:
					if (game.level.id + 1 < GlobalGameParameters.GameLevelCount) {
						game.level.phase = Game.Phase.Shop;
					}
					else {
						game.level.phase = Game.Phase.Victory;
					}
					break;
				case Game.Phase.Shop:
					game.level.id += 1;
					game.level.phase = Game.Phase.Game;
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
			console.log(`Player ${playerId} has left...`);
			const playerEntity = (this as any).game.getPlayer(playerId);
			console.log(playerEntity);
			if (playerEntity) {
				(this as any).game.removeEntity(playerEntity.id);
			}
		},
		playerJoined: (playerId, eventContext) => {
			console.log(`Player ${playerId} has joined...`);
		}
	}
});
