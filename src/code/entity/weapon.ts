import { GameState } from "../game/game";
import { EntityData, EntitySystem } from "./entity";

export interface WeaponData extends EntityData {
	collider: undefined;
}

export class WeaponSystem extends EntitySystem<WeaponData> {

	public onUpdate(entityData: WeaponData, state: GameState, dt: number) {

	}
}