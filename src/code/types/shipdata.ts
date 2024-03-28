import { CircBody, RectBody } from "../entity/transform";
import { V2 } from "../math/vector";

export { };
export interface ShipData {
	type: number;
	sprite: SpriteID;
	speed: number;
	baseHealth: number;
	collider: CircBody | RectBody | null;
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

export interface WeaponProjectileData {
	type: number;
	speed: number;
	damage: number;
}

export interface WeaponEquipmentData {
	projectile: WeaponProjectileData | undefined;
	cooldown: number;
	range: number;
}

export type ShipEquipment = number;
export enum ShipSlot {
	Unknown = 0,
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

declare global {
	interface Number {
		GetShipType(): number;
		GetLeftSlot(): number;
		GetRightSlot(): number;
		GetFrontSlot(): number;
		GetBackSlot(): number;

		SetSprite(value: number): number;

		SetSlot(slot: ShipSlot, value: number): number;

		SetLeftSlot(value: number): number;
		SetRightSlot(value: number): number;
		SetFrontSlot(value: number): number;
		SetBackSlot(value: number): number;
	}
}
Number.prototype.GetShipType = function () { return this.valueOf() & 0xFF; };

Number.prototype.GetLeftSlot = function () { return (this.valueOf() >> 2) & 0xFF; };
Number.prototype.GetRightSlot = function () { return (this.valueOf() >> 4) & 0xFF; };
Number.prototype.GetFrontSlot = function () { return (this.valueOf() >> 6) & 0xFF; };
Number.prototype.GetBackSlot = function () { return (this.valueOf() >> 8) & 0xFF; };

Number.prototype.SetSlot = function (slot: ShipSlot, value: number) {
	switch (slot) {
		case ShipSlot.Back:
			return this.SetBackSlot(value);
		case ShipSlot.Front:
			return this.SetFrontSlot(value);
		case ShipSlot.Left:
			return this.SetLeftSlot(value);
		case ShipSlot.Right:
			return this.SetRightSlot(value);
	}
	return this.valueOf();
};

Number.prototype.SetSprite = function (value: number) {
	if (value < 0 || value > 255)
		throw new Error(`Value ${value} is out of range`);
	return (this.valueOf() & 0xFFFFFFFF00) | value;
};
Number.prototype.SetLeftSlot = function (value: number) {
	if (value < 0 || value > 255)
		throw new Error(`Value ${value} is out of range`);
	return (this.valueOf() & 0xFFFFFF00FF) | value;
};
Number.prototype.SetRightSlot = function (value: number) {
	if (value < 0 || value > 255)
		throw new Error(`Value ${value} is out of range`);
	return (this.valueOf() & 0xFFFF00FFFF) | value;
};
Number.prototype.SetFrontSlot = function (value: number) {
	if (value < 0 || value > 255)
		throw new Error(`Value ${value} is out of range`);
	return (this.valueOf() & 0xFF00FFFFFF) | value;
};
Number.prototype.SetBackSlot = function (value: number) {
	if (value < 0 || value > 255)
		throw new Error(`Value ${value} is out of range`);
	return (this.valueOf() & 0x00FFFFFFFF) | value;
}

/*
export class ShipData {
	raw: number = 0;

	public get ShipSprite() { return this.raw & 0xFF; }
	public set ShipSprite(value: number) {
		if (value > 255 || value < 0)
			throw new Error("Sprite out of range");
		this.raw = (this.raw & 0xFFFFFFFF00) | value;
	}

	public get LeftSlot() { return (this.raw >> 2) & 0xFF; }
	public set LeftSlot(value: number) {
		if (value > 255 || value < 0)
			throw new Error("Sprite out of range");
		this.raw = (this.raw & 0xFFFFFF00FF) | value;
	}

	public get RightSlot() { return (this.raw >> 4) & 0xFF; }
	public set RightSlot(value: number) {
		if (value > 255 || value < 0)
			throw new Error("Sprite out of range");
		this.raw = (this.raw & 0xFFFF00FFFF) | value;
	}

	public get FrontSlot() { return (this.raw >> 6) & 0xFF; }
	public set FrontSlot(value: number) {
		if (value > 255 || value < 0)
			throw new Error("Sprite out of range");
		this.raw = (this.raw & 0xFF00FFFFFF) | value;
	}

	public get BackSlot() { return (this.raw >> 8) & 0xFF; }
	public set BackSlot(value: number) {
		if (value > 255 || value < 0)
			throw new Error("Sprite out of range");
		this.raw = (this.raw & 0x00FFFFFFFF) | value;
	}

	public get RawValue(): number { return this.raw; }
	public set RawValue(value: number) { this.raw = value; }
}
*/
