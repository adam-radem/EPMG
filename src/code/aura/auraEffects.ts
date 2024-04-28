import { DropType } from "../databases/dropdatabase";
import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import { Aura } from "./aura";
import * as Auras from "./basic";

declare type AuraType = DropType;

declare type AddAuraDelegate = (entity: ShipEntity, aura: Aura, state: GameState) => void;
declare type RemoveAuraDelegate = AddAuraDelegate;
declare type AuraUpdateDelegate = (entity: ShipEntity, aura: Aura, state: GameState, dt: number) => void;

export interface AuraCallbacks {
	onCreate?: AddAuraDelegate;
	onRemove?: RemoveAuraDelegate;
	update?: AuraUpdateDelegate;
}

const map: Record<AuraType, AuraCallbacks | undefined> = {
	[DropType.None]: undefined,
	[DropType.Health]: Auras.HealthAura,
	[DropType.Score]: Auras.ScoreAura,
	[DropType.Regenerate]: Auras.RegenerateAura,
	[DropType.WeaponDamage]: undefined,
	[DropType.WeaponInterval]: undefined,
	[DropType.ShotPierce]: undefined,
	[DropType.ShotSpread]: undefined,
	[DropType.BarrierAbsorb]: undefined,
	[DropType.BarrierReflect]: undefined,
	[DropType.BarrierHeal]: undefined,
	[DropType.BarrierArmor]: undefined,
	[DropType.ExtraLasers]: undefined,
	[DropType.SpreadMissiles]: undefined,
	[DropType.ScreenNuke]: undefined
};

export function GetAuraEffects(type: AuraType): AuraCallbacks {
	return map[type] as AuraCallbacks;
}


/*
	//Basic: 0 - 7
	Health = 1, 			//Restores health instantly
	Score = 2, 				//Adds score immediately
	Regenerate = 3, 		//Restores health over time for [duration]

	//Weapon Buffs: 8 - 15
	WeaponDamage = 8,		//Increases damage dealt by [value] for [duration]
	WeaponInterval = 9, 	//Increases fire rate of weapon by [value] for [duration]
	ShotPierce = 10,		//Adds [value] pierce to weapon for [duration]
	ShotSpread = 11,		//Adds [value] additional shots to weapon for [duration]

	//Barrier Buffs: 16 - 23
	BarrierAbsorb = 16,		//Absorbs damage from projectiles up to [value] for [duration]
	BarrierReflect = 17,	//Reflects up to [value] enemy projectiles
	BarrierHeal = 18,		//Heals up to [value] health from projectiles for [duration]
	BarrierArmor = 19,		//Absorbs up to [value] damage from collisions

	//Special Weapons: 24-31
	ExtraLasers = 24,		//Fires an extra laser at every enemy on screen dealing flat damage
	SpreadMissiles = 25,	//Fires a heat-seeking missile at every enemy on screen dealing damage
	ScreenNuke = 31,		//Hits every enemy screen for massive damage
*/