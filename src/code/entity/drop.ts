import { Aura, AuraSystem } from "../aura/aura";
import { DropType, EvaluateDrop, GetDrop } from "../databases/dropdatabase";
import { Destroy, GameState, NextEntityId } from "../game/game";
import { Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { EnemyEntityData } from "./enemy";
import { EntityData } from "./entity";
import { PlayerEntityData } from "./player";
import { CircBody } from "./transform";

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
		applyPickup(entity, player, state);
		Destroy(state, entity.id);
	}

	function applyPickup(entity: DropEntityData, player: PlayerEntityData, state: GameState) {
		const dropData = GetDrop(entity.dropType);
		switch (dropData.dropType) {
			case DropType.None:
				break;
			case DropType.Health:
				player.health = Math.min(player.health + dropData.value, player.maxHealth);
				break;
			case DropType.Score:
				const score = state.scores[player.id] + dropData.value;
				state.scores[player.id] = score;
				break;
			case DropType.Regenerate:
				const aura = AuraSystem.AuraFromDrop(dropData);
				AuraSystem.addAuraToEntity(player, aura, state);
				break;
			case DropType.WeaponDamage:

				break;
			case DropType.WeaponInterval:
			case DropType.ShotPierce:
			case DropType.ShotSpread:
			case DropType.BarrierAbsorb:
			case DropType.BarrierReflect:
			case DropType.BarrierHeal:
			case DropType.BarrierArmor:
			case DropType.ExtraLasers:
			case DropType.SpreadMissiles:
			case DropType.ScreenNuke:
		}
	}
}