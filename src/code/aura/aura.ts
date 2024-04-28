import { DropData, DropType } from "../databases/dropdatabase";
import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import * as Effects from "./auraEffects";

export interface Aura {
	type: AuraType;
	value: number;
	endsAt: number;
}

declare type AuraType = DropType;

export module AuraSystem {

	export function AuraFromDrop(drop: DropData): Aura {
		const aura: Aura = {
			type: drop.dropType,
			value: drop.value,
			endsAt: drop.duration || 0
		};
		return aura;
	}

	export function addAuraToEntity(entity: ShipEntity, aura: Aura, state: GameState) {
		entity.auras.push(aura);
		applyAura(entity, aura, state);
	}

	export function onUpdate(entity: ShipEntity, state: GameState, dt: number) {
		if (!entity.auras || entity.auras.length == 0)
			return;

		for (let i = entity.auras.length - 1; i >= 0; --i) {
			const aura = entity.auras[i];
			if (aura.endsAt <= state.time) {
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