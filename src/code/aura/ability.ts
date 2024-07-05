import { GameState } from "../game/game";

import { abilities } from "../../data/abilitydata.json";
import { Ability, AbilitySet } from "../databases/dropdatabase";
import { PlayerId } from "dusk-games-sdk";
import { AuraSystem } from "./aura";


const map: Record<number, Partial<Ability>> = {};
for (const [, v] of Object.entries(abilities)) {
	map[v.id] = v;
}

export function GetAbilityData(id: number) {
	return map[id] as Ability;
}

export module AbilitySystem {
	export const DefaultAbilityCooldown = 5000;

	export function createInitialAbility(abilityId: number, state: GameState): Ability {
		const ability = GetAbilityData(abilityId);
		return ability || { id: 0, charges: -1, cooldown: 0, auraList: [] };
	}

	export function onUpdate(set: AbilitySet, state: GameState, dt: number) {
		for (let i = set.abilities.length - 1; i >= 0; --i) {
			const ability = set.abilities[i];
			if (ability.charges == 0) {
				delete set.abilities[i];
				continue;
			}

			if (ability.cooldown > 0)
				ability.cooldown -= dt;
		}
	}

	export function activate(state: GameState, playerId: PlayerId, data: Ability) {
		const abilityData = GetAbilityData(data.id);
		if (abilityData) {
			for (let i = 0; i != abilityData.auraList.length; ++i) {
				const aura = AuraSystem.AuraFromAbility(abilityData.auraList[i]);
				AuraSystem.addAuraToEntity(state.players[playerId], aura, state);
			}

			let maxDuration = 0;
			abilityData.auraList.map(el => maxDuration = Math.max(maxDuration, el.duration ?? 0));

			data.cooldown = abilityData.cooldown || DefaultAbilityCooldown;
			data.endTime = state.time + maxDuration;
			if (data.charges > 0) {
				data.charges -= 1;
			}
		}
	}
}