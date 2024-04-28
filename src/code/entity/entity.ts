import { Aura } from "../aura/aura";
import { GameState } from "../game/game";
import { ShipEquipment } from "../types/shipdata";
import { Collider, TransformData } from "./transform";

export interface EntityData {
	id: EntityId,
	transform: TransformData;
	speed: number;
}

export interface ShipEntity extends EntityData {
	shipData: ShipEquipment;
	health: number;
	maxHealth: number;
	collider: Collider;
	auras: Aura[];
}