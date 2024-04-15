import { Aura } from "../aura/aura";
import { GameState } from "../game/game";
import { ShipEquipment } from "../types/shipdata";
import { Collider, TransformData } from "./transform";

export interface EntityData {
	id: EntityId,
	transform: TransformData;
	speed: number;
	auras?: Aura[];
}

export interface ShipEntity extends EntityData {
	shipData: ShipEquipment;
	health: number;
	maxHealth: number;
	collider: Collider;
}

export class EntitySystem<T extends EntityData> {
	public onUpdate(entityData: T, state: GameState, dt: number) { }

	public onCollide?(entityData: T, other: EntityData, state: GameState): void;
}