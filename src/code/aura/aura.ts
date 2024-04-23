import { GetEquipmentData } from "../databases/equipdatabase";
import { EntityData, EntitySystem, ShipEntity } from "../entity/entity";
import { EquipData } from "../entity/equip";
import { PlayerEntityData } from "../entity/player";
import { Destroy, GameState } from "../game/game";
import { WeaponEquipmentData } from "../types/shipdata";

enum AuraType {
	Unknown = 0,
	Stats = 1,
	DamageTaken = 2,
	DamageDealt = 3
}

export interface Aura {
	type: AuraType;
	id: EntityId;
	source: EntityId;
	expires: number;
}

interface StatsModifier extends Aura {
	speedMod?: number;
}

function isStatModifier(mod: Aura): mod is StatsModifier {
	return (mod as StatsModifier).speedMod !== undefined;
}

interface DamageTakenModifier extends Aura {
	damageTakenMod?: number;
}

function isDamageTakenModifier(mod: Aura): mod is DamageTakenModifier {
	return (mod as DamageTakenModifier).damageTakenMod !== undefined;
}

interface DamageDealtModifier extends Aura {
	damageDealtMod?: number;
}

function isDamageDealtModifier(mod: Aura): mod is DamageDealtModifier {
	return (mod as DamageDealtModifier).damageDealtMod !== undefined;
}

interface WeaponModifier extends Aura {
	weaponTimeScale?: number;
	weaponRange?: number;
	weaponDamageMod?: number;
}

function isWeaponModifier(mod: Aura): mod is WeaponModifier {
	const wMod = mod as WeaponModifier;
	return (wMod.weaponDamageMod !== undefined) ||
		(wMod.weaponRange !== undefined) ||
		(wMod.weaponDamageMod !== undefined);
}

enum ModifierClass {
	All,
	AllPlayers,
	AllEnemies,
	AllProjectiles,
	TargetPlayer,
	TargetEnemy
}

export class AuraSystem {
	public onUpdate(auraData: Aura, state: GameState, dt: number) {
		if (state.time >= auraData.expires) {
			Destroy(auraData.id);
			return;
		}
	}

	public ApplyStatsModifiers(data: EntityData): EntityData {
		if (data.auras) {
			const statModifiers = data.auras.filter(x => isStatModifier(x));
			if (statModifiers.length > 0) {
				const entity = structuredClone(data);
				for (const aura of statModifiers) {
					this.ApplyStats(aura, entity);
				}
				return entity;
			}
		}
		return data;
	}

	private ApplyStats(modifier: StatsModifier, entity: EntityData) {
		if (modifier.speedMod) {
			entity.speed *= modifier.speedMod;
		}
	}

	public ApplyDamageTakenModifiers(data: EntityData, damageTaken: number) {
		if (data.auras) {
			const modifiers = data.auras.filter(x => isDamageTakenModifier(x));
			for (const aura of modifiers) {
				damageTaken = this.ApplyDamageTaken(aura, data, damageTaken);
			}
		}
		return damageTaken;
	}

	private ApplyDamageTaken(modifier: DamageTakenModifier, entity: EntityData, damageTaken: number) {
		if (modifier.damageTakenMod)
			damageTaken *= modifier.damageTakenMod;
		return damageTaken;
	}

	public ApplyDamageDealtModifiers(data: EntityData, damageDealt: number) {
		if (data.auras) {
			const modifiers = data.auras.filter(x => isDamageDealtModifier(x));
			for (const aura of modifiers) {
				damageDealt = this.ApplyDamageDealt(aura, data, damageDealt);
			}
		}
		return damageDealt;
	}

	private ApplyDamageDealt(modifier: DamageDealtModifier, entity: EntityData, damageDealt: number) {
		if (modifier.damageDealtMod) {
			damageDealt *= modifier.damageDealtMod;
		}
		return damageDealt;
	}

	public ApplyWeaponModifiers(entity: EquipData) {
		const equipData = GetEquipmentData(entity.type);
		if (!equipData.weapon)
			return undefined;

		if (entity.auras) {
			const modifiers = entity.auras.filter(x => isWeaponModifier(x));
			if (modifiers.length > 0) {
				const weapon = structuredClone(equipData.weapon);
				for (const mod of modifiers) {
					this.ApplyWeapon(mod, weapon);
				}
			}
		}

		return equipData.weapon;
	}

	private ApplyWeapon(mod: WeaponModifier, weapon: WeaponEquipmentData) {
		if (mod.weaponDamageMod && weapon.projectile)
			weapon.projectile.damage *= mod.weaponDamageMod;

		if (mod.weaponTimeScale)
			weapon.cooldown /= mod.weaponTimeScale;

		if (mod.weaponRange)
			weapon.range *= mod.weaponRange;

		return weapon;
	}
}
