import type { RuneClient } from "rune-games-sdk/multiplayer";
import { GameActions } from "./code/game/actions";
import { Game, GameState, LevelState } from "./code/game/game";
import { GlobalGameParameters } from "./code/game/static";

declare global {
	const Rune: RuneClient<GameState, GameActions>;
}

Rune.initLogic({
	minPlayers: 1,
	maxPlayers: 2,
	updatesPerSecond: 30,
	setup: Game.CreateGame,
	actions: {
		setVelocity: ({ newVelocity }, { game, playerId }) => {
			const playerEntity = Game.CurrentGame.getPlayer(playerId);
			const vel = playerEntity?.getData?.().velocity;
			if (vel) {
				vel.x = newVelocity.x;
				vel.y = newVelocity.y;
			}
		},
		endScene: ({ }, { game }) => {
			switch (game.level.state) {
				case LevelState.Briefing:
					Game.CurrentGame.startLevel(game, 0);
					break;
				case LevelState.Game:
					if (game.level.id + 1 < GlobalGameParameters.GameLevelCount) {
						Game.CurrentGame.openShop(game);
					}
					else {
						Game.CurrentGame.victory(game);
					}
					break;
				case LevelState.Shop:
					Game.CurrentGame.startLevel(game, game.level.id + 1);
					break;
			}
		}
	},
	update: ({ game, allPlayerIds }) => {
		Game.CurrentGame?.update(game, allPlayerIds);
	},
	events: {
		playerLeft: (playerId, eventContext) => {
			if (!Game.CurrentGame) {
				console.log(`Game was never initialized!`);
				return;
			}
			console.log(`Player ${playerId} has left...`);
			const playerEntity = Game.CurrentGame.getPlayer(playerId);
			console.log(playerEntity);
			if (playerEntity) {
				Game.CurrentGame.removeEntity(playerEntity.id);
			}
		},
		playerJoined: (playerId, eventContext) => {
			console.log(`Player ${playerId} has joined...`);
		}
	}
});
