import { PlayerId } from "rune-games-sdk";
import { EntityId, Entity } from "./entity";
import { PlayerEntity } from "./player";

export class EntityList {
	public allEntities: Record<EntityId, Entity<any>>;
	public playerMap: Record<PlayerId, EntityId>;

	public removedEntities: EntityId[];

	public constructor() {
		this.allEntities = {};
		this.playerMap = {};
		this.removedEntities = [];
	}

	public addEntity(entity: Entity<any>) {
		if (this.allEntities[entity.id]) {
			console.warn(`Adding duplicate entity ${entity.id}`);
			return;
		}

		this.allEntities[entity.id] = entity;
		if (entity instanceof PlayerEntity) {
			this.playerMap[entity?.PlayerId] = entity.id;
			console.log(`Added ${entity?.PlayerId} as entity ${entity.id}`);
		}
	}

	public getPlayer(playerId: PlayerId): PlayerEntity | undefined {
		const id = this.playerMap[playerId];
		if (id) {
			return this.allEntities[id] as PlayerEntity;
		}
		return undefined;
	}

	public cleanup() {
		for (var removed of this.removedEntities) {
			const entity = this.allEntities[removed];
			entity.onDestroy?.();
			delete this.allEntities[removed];
		}
	}
}