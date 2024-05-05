import { DropType } from "../databases/dropdatabase";
import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import { Aura } from "./aura";
import * as BasicAuras from "./basic";
import * as WeaponAuras from "./weapon";
import * as BarrierAuras from "./barrier";
import * as SpecialAuras from "./special";

declare type AuraType = DropType;

declare type AddAuraDelegate = (entity: ShipEntity, aura: Aura, state: GameState) => void;
declare type RemoveAuraDelegate = AddAuraDelegate;
declare type AuraUpdateDelegate = (entity: ShipEntity, aura: Aura, state: GameState, dt: number) => void;

export interface AuraCallbacks {
	onCreate?: AddAuraDelegate;
	onRemove?: RemoveAuraDelegate;
	update?: AuraUpdateDelegate;
}

const map: Record<AuraType, AuraCallbacks> = {
	[DropType.None]: BasicAuras.EmptyAura,

	[DropType.Health]: BasicAuras.HealthAura,
	[DropType.Score]: BasicAuras.ScoreAura,
	[DropType.Regenerate]: BasicAuras.RegenerateAura,

	[DropType.WeaponDamage]: WeaponAuras.WeaponDamageAura,
	[DropType.WeaponInterval]: WeaponAuras.WeaponIntervalAura,
	[DropType.ShotPierce]: WeaponAuras.ShotPierceAura,
	[DropType.ShotSpread]: WeaponAuras.ShotSpreadAura,

	[DropType.BarrierAbsorb]: BarrierAuras.BarrierAbsorb,
	[DropType.BarrierReflect]: BarrierAuras.BarrierReflect,
	[DropType.BarrierHeal]: BarrierAuras.BarrierHeal,
	[DropType.BarrierArmor]: BarrierAuras.BarrierArmor,

	[DropType.ExtraLasers]: SpecialAuras.ExtraLasers,
	[DropType.SpreadMissiles]: SpecialAuras.SpreadMissiles,
	[DropType.ScreenNuke]: SpecialAuras.ScreenNuke
};

export function GetAuraEffects(type: AuraType): AuraCallbacks {
	return map[type] as AuraCallbacks;
}