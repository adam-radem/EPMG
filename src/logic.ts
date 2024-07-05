import type { DuskClient } from "dusk-games-sdk";
import { GameActions } from "./code/game/actions";
import * as Game from "./code/game/game";
import { GlobalGameParameters } from "./code/game/static";

declare global {
	const Dusk: DuskClient<Game.GameState, GameActions>;
}

Dusk.initLogic({
	minPlayers: 1,
	maxPlayers: 4,
	updatesPerSecond: 30,
	reactive: false,
	setup: (allPlayerIds: string[]) => {
		return Game.NewGameState(allPlayerIds);
	},
	actions: {
		setShip: ({ id }, { game, playerId }) => {
			if (game.level.phase !== Game.Phase.Briefing)
				throw Dusk.invalidAction();

			if (game.players[playerId].shipData > 0)
				throw Dusk.invalidAction();

			Game.SetPlayerShip(game, playerId, id);
		},
		setTarget: ({ newTarget }, { game, playerId }) => {
			if (game.level.phase !== Game.Phase.Level)
				throw Dusk.invalidAction();

			const playerData = game.players[playerId];
			playerData.target = newTarget;
		},
		activateAbility: ({ abilityId: abilityId }, { game, playerId }) => {
			if (!Game.ActivatePlayerAbility(game, playerId, abilityId)) {
				throw Dusk.invalidAction();
			}
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
