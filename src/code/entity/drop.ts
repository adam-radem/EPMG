import { PlayerId } from "rune-games-sdk";
import { EvaluateDrop, GetDrop } from "../databases/dropdatabase";
import { AddPlayerAbility, Destroy, GameState, NextEntityId } from "../game/game";
import { Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { EnemyEntityData } from "./enemy";
import { EntityData } from "./entity";
import { PlayerEntityData } from "./player";
import { CircBody } from "./transform";
import { GetAbilityData } from "../aura/ability";

export interface DropEntityData extends EntityData {
	collider: CircBody;
	expireTime: number;
	dropType: number;
}

export module DropSystem {
	export function tryCreateDrop(source: EnemyEntityData, state: GameState) {
		const drop = EvaluateDrop(source);
		if (drop) {
			const id = NextEntityId(state);
			const newDrop: DropEntityData = {
				id: id,
				dropType: drop.type,
				transform: {
					position: source.transform.position,
					angle: 0,
					scale: 1
				},
				collider: {
					center: Vector2.zero(),
					radius: 30,
				},
				speed: 300,
				expireTime: 3000
			};
			state.drops[id] = newDrop;
		}
	}

	export function onUpdate(entity: DropEntityData, state: GameState, dt: number) {
		const dropMaxY = Screen.PlayableArea.y - 40;

		if (entity.transform.position.y < dropMaxY) {
			const v2 = Vector2.addVector(entity.transform.position, Vector2.makeVector(0, entity.speed * dt / 1000));
			entity.transform.position = v2;
		}
		else if (entity.expireTime > 0) {
			entity.expireTime -= dt;
			if (entity.expireTime < 0) {
				Destroy(state, entity.id);
			}
		}
	}

	export function onCollect(entity: DropEntityData, player: PlayerEntityData, state: GameState) {
		if (applyPickup(entity, player, state))
			Destroy(state, entity.id);
	}

	//returns true if the item was picked up properly
	function applyPickup(entity: DropEntityData, player: PlayerEntityData, state: GameState): boolean {
		const drop = GetDrop(entity.dropType);

		let pickedUp = false;

		if (drop.healthRestore) {
			player.health = Math.min(player.health + drop.healthRestore, player.maxHealth);
			pickedUp = true;
		}
		if (drop.scoreValue) {
			state.scores[player.id] = state.scores[player.id] + drop.scoreValue;
			pickedUp = true;
		}

		if (drop.ability) {
			const ability = GetAbilityData(drop.ability);
			pickedUp = AddPlayerAbility(state, player.id as PlayerId, ability) || pickedUp;
		}

		return pickedUp;
	}
}