import { GameState } from "../game/game";
import { EntityData, EntitySystem } from "./entity";
import { CircBody } from "./transform";

export interface ProjectileData extends EntityData {
	collider: CircBody
}

export class ProjectileSystem extends EntitySystem<ProjectileData> {

	public onUpdate(entityData: ProjectileData, state: GameState, dt: number) {
		
	}
}