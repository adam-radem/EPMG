import { GameState } from "../game/game";
import { ShipEquipment } from "../types/shipdata";
import { CircBody, RectBody, TransformData } from "./transform";

export interface EntityData {
	id: EntityId,
	transform: TransformData;
}

export interface ShipEntity extends EntityData {
	shipData: ShipEquipment;
	collider: RectBody | CircBody | undefined;
	health: number;
	maxHealth: number;
}

export class EntitySystem<T extends EntityData> {
	public onUpdate(entityData: T, state: GameState, dt: number) { }
}