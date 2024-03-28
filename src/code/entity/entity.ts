import { GameState } from "../game/game";
import { ShipEquipment } from "../types/shipdata";
import { Collider, TransformData } from "./transform";

export interface EntityData {
	id: EntityId,
	transform: TransformData;
	collider: Collider;
}

export interface ShipEntity extends EntityData {
	shipData: ShipEquipment;
	health: number;
	maxHealth: number;
}

export class EntitySystem<T extends EntityData> {
	public onUpdate(entityData: T, state: GameState, dt: number) { }

	public onCollide?(entityData: T, other: EntityData, state: GameState): void;
}