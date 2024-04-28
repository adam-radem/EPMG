import { ShipEntity } from "../entity/entity";
import { GameState } from "../game/game";
import { Aura } from "./aura";
import { AuraCallbacks } from "./auraEffects";

function Health(entity: ShipEntity, aura: Aura, state: GameState) {
	entity.health = Math.min(entity.maxHealth, entity.health + aura.value);
}

function Score(entity: ShipEntity, aura: Aura, state: GameState) {
	const id = entity.id;
	if (id in state.scores) {
		const pscore = state.scores[id] + aura.value;
		state.scores[id] = pscore;
	}
}

function Regenerate(entity: ShipEntity, aura: Aura, state: GameState, dt: number) {
	entity.health = Math.min(entity.maxHealth, entity.health + aura.value);
}

export const HealthAura: AuraCallbacks = { onCreate: Health };
export const ScoreAura: AuraCallbacks = { onCreate: Score };
export const RegenerateAura: AuraCallbacks = {
	update: Regenerate
};
