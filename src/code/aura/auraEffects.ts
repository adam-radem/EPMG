import { AbilityType } from "../databases/dropdatabase";
import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import { Aura } from "./aura";
import * as BasicAuras from "./basic";
import * as WeaponAuras from "./weapon";
import * as BarrierAuras from "./barrier";
import * as SpecialAuras from "./special";

declare type AuraType = AbilityType;

declare type AddAuraDelegate = (entity: ShipEntity, aura: Aura, state: GameState) => void;
declare type RemoveAuraDelegate = AddAuraDelegate;
declare type AuraUpdateDelegate = (entity: ShipEntity, aura: Aura, state: GameState, dt: number) => void;

export interface AuraCallbacks {
	onCreate?: AddAuraDelegate;
	onRemove?: RemoveAuraDelegate;
	update?: AuraUpdateDelegate;
}

const map: Record<AuraType, AuraCallbacks> = {
	[AbilityType.None]: BasicAuras.EmptyAura,

	[AbilityType.Health]: BasicAuras.HealthAura,
	[AbilityType.Score]: BasicAuras.ScoreAura,
	[AbilityType.Regenerate]: BasicAuras.RegenerateAura,

	[AbilityType.WeaponDamage]: WeaponAuras.WeaponDamageAura,
	[AbilityType.WeaponInterval]: WeaponAuras.WeaponIntervalAura,
	[AbilityType.ShotPierce]: WeaponAuras.ShotPierceAura,
	[AbilityType.ShotSpread]: WeaponAuras.ShotSpreadAura,

	[AbilityType.BarrierAbsorb]: BarrierAuras.BarrierAbsorb,
	[AbilityType.BarrierReflect]: BarrierAuras.BarrierReflect,
	[AbilityType.BarrierHeal]: BarrierAuras.BarrierHeal,
	[AbilityType.BarrierArmor]: BarrierAuras.BarrierArmor,

	[AbilityType.ExtraLasers]: SpecialAuras.ExtraLasers,
	[AbilityType.SpreadMissiles]: SpecialAuras.SpreadMissiles,
	[AbilityType.ScreenNuke]: SpecialAuras.ScreenNuke
};

export function GetAuraEffects(type: AuraType): AuraCallbacks {
	return map[type] as AuraCallbacks;
}