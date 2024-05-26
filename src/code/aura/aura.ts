import { AbilityData, AbilityType } from "../databases/dropdatabase";
import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import * as Effects from "./auraEffects";

export interface Aura {
	type: AuraType;
	value: number;
	flag?: number;
	endsAt: number;
}

declare type AuraType = AbilityType;

export module AuraSystem {

	export function AuraFromAbility(ability: AbilityData): Aura {
		const aura: Aura = {
			type: ability.abilityType,
			value: ability.value,
			endsAt: ability.duration || 0
		};
		return aura;
	}

	export function addAuraToEntity(entity: ShipEntity, aura: Aura, state: GameState) {
		aura.endsAt += state.time;
		entity.auras.push(aura);
		applyAura(entity, aura, state);
	}

	export function onUpdate(entity: ShipEntity, state: GameState, dt: number) {
		if (!entity.auras || entity.auras.length == 0)
			return;

		for (let i = entity.auras.length - 1; i >= 0; --i) {
			const aura = entity.auras[i];

			if (!aura) {
				delete (entity.auras[i]);
				continue;
			}

			if (aura && aura.endsAt <= state.time) {
				removeAura(entity, aura, state);
				delete entity.auras[i];
				continue;
			}

			updateAura(entity, aura, state, dt);
		}
	}

	function applyAura(entity: ShipEntity, aura: Aura, state: GameState) {
		const effectDelegate = Effects.GetAuraEffects(aura.type).onCreate;
		effectDelegate?.call(null, entity, aura, state);
	}

	function removeAura(entity: ShipEntity, aura: Aura, state: GameState) {
		const effectDelegate = Effects.GetAuraEffects(aura.type).onRemove;
		effectDelegate?.call(null, entity, aura, state);
	}

	function updateAura(entity: ShipEntity, aura: Aura, state: GameState, dt: number) {
		const effectDelegate = Effects.GetAuraEffects(aura.type).update;
		effectDelegate?.call(null, entity, aura, state, dt);
	}
}