import { ShipEntity } from "../entity/entity";
import { WeaponModifierData } from "../entity/equip";
import { GameState } from "../game/game";
import { Aura } from "./aura";
import { AuraCallbacks } from "./auraEffects";

function ApplyWeaponDamage(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.damageMod;
			if (modValue)
				modValue *= aura.value;
			else
				modValue = aura.value;

			mod.damageMod = modValue;
		}
	}
}
function RemoveWeaponDamage(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.damageMod;
			if (modValue)
				modValue /= aura.value;

			mod.damageMod = modValue;
		}
	}
}

function ApplyWeaponInterval(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.intervalMod;
			if (modValue)
				modValue *= aura.value;
			else
				modValue = aura.value;

			mod.intervalMod = modValue;
		}
	}
}
function RemoveWeaponInterval(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.intervalMod;
			if (modValue)
				modValue /= aura.value;

			mod.intervalMod = modValue;
		}
	}
}

function ApplyShotPierce(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.pierceMod;
			modValue = modValue ? modValue + aura.value : aura.value;

			mod.pierceMod = modValue;
		}
	}
}
function RemoveShotPierce(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.pierceMod;
			if (modValue)
				modValue -= aura.value;

			mod.pierceMod = modValue;
		}
	}
}

function ApplyShotSpread(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.spreadMod;
			if (modValue)
				modValue *= aura.value;
			else
				modValue = aura.value;

			mod.spreadMod = modValue;
		}
	}
}
function RemoveShotSpread(entity: ShipEntity, aura: Aura, state: GameState) {
	for (const eid in state.equipment) {
		const equipData = state.equipment[eid];
		if (equipData.owner === entity.id) {
			const mod = (equipData.modifiers as WeaponModifierData);
			let modValue = mod.spreadMod;
			if (modValue)
				modValue /= aura.value;

			mod.spreadMod = modValue;
		}
	}
}

export const WeaponDamageAura: AuraCallbacks = {
	onCreate: ApplyWeaponDamage,
	onRemove: RemoveWeaponDamage
};
export const WeaponIntervalAura: AuraCallbacks = {
	onCreate: ApplyWeaponInterval,
	onRemove: RemoveWeaponInterval
};
export const ShotPierceAura: AuraCallbacks = {
	onCreate: ApplyShotPierce,
	onRemove: RemoveShotPierce
};
export const ShotSpreadAura: AuraCallbacks = {
	onCreate: ApplyShotSpread,
	onRemove: RemoveShotSpread
};