import { Aura } from "../aura/aura";
import { GameState } from "../game/game";
import { ShipEquipment } from "../types/shipdata";
import { Collider, TransformData } from "./transform";

export interface EntityData {
	id: EntityId,
	transform: TransformData;
	speed: number;
	vel?: number;
}

export interface ShipEntity extends EntityData {
	shipData: ShipEquipment;
	health: number;
	maxHealth: number;
	collider: Collider;
	auras: Aura[];

	//Aura Buff Values
	absorb?: number;
	reflect?: number;
	heal?: number;
	armor?: number;
}