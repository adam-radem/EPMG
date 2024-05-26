import { AbilityType } from "../databases/dropdatabase";
import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import { Aura } from "./aura";
import { AuraCallbacks } from "./auraEffects";

function AbsorbCreate(entity: ShipEntity, aura: Aura, state: GameState) {
	for (let i = 0; i != entity.auras.length; ++i) {
		const aura = entity.auras[i];
		if (aura && aura.type === AbilityType.BarrierAbsorb) {
			delete entity.auras[i];
			break;
		}
	}
	entity.absorb = aura.value;
}

function AbsorbRemove(entity: ShipEntity, aura: Aura, state: GameState) {
	entity.absorb = undefined;
}

function ReflectCreate(entity: ShipEntity, aura: Aura, state: GameState) {
	for (let i = 0; i != entity.auras.length; ++i) {
		const aura = entity.auras[i];
		if (aura && aura.type === AbilityType.BarrierReflect) {
			delete entity.auras[i];
			break;
		}
	}
	entity.reflect = aura.value;
}

function ReflectRemove(entity: ShipEntity, aura: Aura, state: GameState) {
	entity.reflect = undefined;
}

function HealCreate(entity: ShipEntity, aura: Aura, state: GameState) {
	for (let i = 0; i != entity.auras.length; ++i) {
		const aura = entity.auras[i];
		if (aura && aura.type === AbilityType.BarrierHeal) {
			delete entity.auras[i];
			break;
		}
	}
	entity.heal = aura.value;
}

function HealRemove(entity: ShipEntity, aura: Aura, state: GameState) {
	entity.heal = undefined;
}

function ArmorCreate(entity: ShipEntity, aura: Aura, state: GameState) {
	for (let i = 0; i != entity.auras.length; ++i) {
		const aura = entity.auras[i];
		if (aura && aura.type === AbilityType.BarrierArmor) {
			delete entity.auras[i];
			break;
		}
	}
	entity.armor = aura.value;
}

function ArmorRemove(entity: ShipEntity, aura: Aura, state: GameState) {
	entity.armor = undefined;
}

export const BarrierAbsorb: AuraCallbacks = {
	onCreate: AbsorbCreate,
	onRemove: AbsorbRemove
};
export const BarrierReflect: AuraCallbacks = {
	onCreate: ReflectCreate,
	onRemove: ReflectRemove
};
export const BarrierHeal: AuraCallbacks = {
	onCreate: HealCreate,
	onRemove: HealRemove
};
export const BarrierArmor: AuraCallbacks = {
	onCreate: ArmorCreate,
	onRemove: ArmorRemove
};
/*
	BarrierAbsorb = 16,		//Absorbs damage from projectiles up to [value] for [duration]
	BarrierReflect = 17,	//Reflects up to [value] enemy projectiles
	BarrierHeal = 18,		//Heals up to [value] health from projectiles for [duration]
	BarrierArmor = 19,		//Absorbs up to [value] damage from collisions
	*/
