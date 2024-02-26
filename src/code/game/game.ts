import { EntityId, Entity } from "../entity/entity";
import { PlayerId } from "rune-games-sdk";
import { PlayerEntity, PlayerEntityData } from "../entity/player";
import { World } from "../level/world";
import { GlobalGameParameters } from "./static";
import { EnemyEntity, EnemyEntityData } from "../entity/enemy";
import { TransformData } from "../entity/transform";
import { EntityList } from "../entity/entityList";

export enum LevelState {
	Briefing,
	Game,
	Shop,
	Victory,
	Defeat
}

export class Game {
	private static instance: Game;
	public static get CurrentGame() {
		return this.instance;
	}

	private entityList: EntityList;

	constructor(state: GameState) {
		this.entityList = new EntityList();
	}

	public addEntity(state: GameState, entity: Entity<any>) {
		this.entityList.addEntity(entity);
		state.transforms[entity.id] = entity.transform;
		state.entityData[entity.id] = entity?.getData?.();
	}

	public removeEntity(entityId: EntityId) {
		this.entityList.removedEntities.push(entityId);
	}

	public getPlayer(playerId: PlayerId) {
		return this.entityList.getPlayer(playerId);
	}

	//Main gameplay update loop
	public update(state: GameState, playerIds: string[]): void {
		switch (state.level.state) {
			case LevelState.Victory:
				state.level.progress += Rune.msPerUpdate;
				if (state.level.progress >= 5) {
					this.exitGame();
				}
				return;
			case LevelState.Briefing:
				return;
		}


		const localState = JSON.parse(JSON.stringify(state));
		/// Transform Pass ///
		//Update entity positions to match the current game state

		//Synchronize entity positions with current game state positions
		//This is important because if the state has rolled back the 
		//entities need to be repositioned to their previous points
		for (const id in this.entityList.allEntities) {
			const transformData = localState.transforms[id];
			this.entityList.allEntities[id].updateTransform(transformData);
		}

		/// World State Pass ///
		//Calculate the current World state based on the initial state of the level
		//Update World
		if (Rune.msPerUpdate) {//weird bug where Rune global objects get reassigned
			World.Current.onUpdate?.(localState, Rune.msPerUpdate);
		}

		/// Individual Update Pass ///
		//All entities run their game logic here in a specific order
		const allEntities = Object.entries(this.entityList.allEntities).map(x => x[1]);
		//Entity contains an updateOrder which specifies how soon it should be updated
		//Players = 50, Enemies = 60, Default = 100
		allEntities.sort((a, b) => a.updateOrder() - b.updateOrder());

		//Update entities that have an update function implemented
		for (var entity of allEntities) {
			entity?.onUpdate?.(localState);
		}

		/// Collision Pass ///
		//Resolve collisions between entities and invoke callbacks

		/// Destruction Pass ///
		//Remove any entities that have been flagged as Destroyed
		this.entityList.cleanup();

		/// Cleanup Pass ///
		//Reassign updated level data
		state.level.id = localState.level.id;
		state.level.state = localState.level.state;
		state.level.progress = localState.level.progress;

		//Reassign all entity data back into the game state
		state.transforms = {};
		state.entityData = {};

		//Reassign all the updated entity data back to the game state
		for (const id in this.entityList.allEntities) {
			const entity = this.entityList.allEntities[id];
			const data = entity.transform;
			state.transforms[entity.id] = data;

			const entityData = entity?.getData?.();
			if (entityData) {
				state.entityData[entity.id] = entityData;
			}
		}
	}

	public startLevel(state: GameState, levelId: number) {
		// this.state!.gameLevelId = levelId;
		// this.state!.levelProgress = 0;
		// this.state!.levelState = LevelState.Game;
	}

	public openShop(state: GameState) {
		state.level.state = LevelState.Shop;
	}

	public victory(state: GameState) {
		state.level.state = LevelState.Victory;
		Rune.gameOver({
			players: state.playerScores,
			delayPopUp: true
		});
	}

	public defeat(state: GameState) {
		state.level.state = LevelState.Defeat;
		const playerState: any = {};
		for (const id in state.playerScores) {
			playerState[id] = "LOST";
		}
		Rune.gameOver({
			players: playerState,
			delayPopUp: false
		});
	}

	public exitGame() {
		Rune.showGameOverPopUp();
	}

	static CreateGame(allPlayerIds: string[]): GameState {
		const state: GameState = {
			level: {
				state: LevelState.Briefing,
				id: 0,
				segment: 0,
				progress: 0,
			},
			playerScores: {},
			transforms: {},
			entityData: {}
		};

		Game.instance = new Game(state);

		for (let playerId of allPlayerIds) {
			const player: PlayerEntity = new PlayerEntity(playerId);
			Game.instance.addEntity(state, player);

			state.playerScores[playerId] = 0;
		}
		console.log(`Game has been initialized with ${allPlayerIds.length} players`);
		console.log(state);
		return state;
	}
}

export interface GameLevelState {
	state: LevelState;
	id: number;
	segment: number;
	progress: number;
}

export interface GameState {
	level: GameLevelState;
	playerScores: Record<PlayerId, number>;
	transforms: Record<EntityId, TransformData>;
	entityData: Record<EntityId, any>;
}