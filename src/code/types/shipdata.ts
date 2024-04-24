import { ProjectileMotion } from "../entity/projectile";
import { CircBody, RectBody, Body } from "../entity/transform";
import { V2 } from "../math/vector";

export { };
export interface ShipData {
	type: number;
	sprite: SpriteID;
	speed: number;
	baseHealth: number;
	defaultWeapon: number;
	collider: CircBody | RectBody | Body;
	equipPositions: {
		left: V2;
		right: V2;
		front: V2;
		back: V2;
	};
}

export interface ShipEquipmentData {
	type: number;
	slot: ShipSlot;
	sprite: SpriteID;
	anchor: V2;
	weapon: WeaponEquipmentData | undefined;
}

export interface ProjectileSpriteData {
	type: number;
	sprite: SpriteID;
}

export interface WeaponProjectileData {
	type: number;
	speed: number;
	damage: number;
	motion: ProjectileMotion;
	life: number;
	spread: number;
	pierce?: number;
}

export interface WeaponEquipmentData {
	projectile: WeaponProjectileData | undefined;
	cooldown: number;
	range: number;
	special?: number;
	specialValue?: number;
}

export type ShipEquipment = number;
export enum ShipSlot {
	ShipType = 0,
	Left = 1,
	Right = 2,
	Front = 4,
	Back = 8
};

export class Ships {
	static Empty: ShipEquipment = 0;
	static Colors: number[] = [0, 1, 2, 3];
	static Players: ShipEquipment[] = [4, 8, 12];
	static Enemies: ShipEquipment[] = [16, 20, 24, 28, 32];

	static RandomColor(): number {
		return this.Colors[Math.floor(Math.random() * this.Colors.length)];
	}
}

export function GetShipType(equipment: ShipEquipment) {
	return GetSlot(equipment, ShipSlot.ShipType);
}

export function SetShipType(equipment: ShipEquipment, value: ShipEquipment) {
	return SetSlot(equipment, ShipSlot.ShipType, value);
}

export function GetSlot(equipment: ShipEquipment, slot: ShipSlot) {
	return (equipment >> (slot * 2)) & 0xFF;
}

export function SetSlot(equipment: ShipEquipment, slot: ShipSlot, value: ShipEquipment) {
	const max_value = 0xFFFFFFFFF;
	const val = 0xFF << (slot * 2);
	const mask = (max_value ^ val);
	return (equipment & mask) | (value << (slot * 2));
}
