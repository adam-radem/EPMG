import { Screen } from "../rendering/screen";
import { EntityData, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { CircBody } from "./transform";
import { AddScoreToPlayer, GameState } from "../game/game";
import { EnemyEntityData, isEnemy } from "./enemy";
import { GlobalGameParameters } from "../game/static";
import { AuraSystem } from "../aura/aura";

export interface PlayerEntityData extends ShipEntity {
	target: V2;
	idx: number;
	collider: CircBody;
}

export function isPlayer(object: EntityData): object is PlayerEntityData {
	return (object as PlayerEntityData).idx !== undefined;
}

export module PlayerSystem {
	export function onUpdate(entity: PlayerEntityData, state: GameState, dt: number): void {
		if (entity.health <= 0) {
			return;
		}

		AuraSystem.onUpdate(entity, state, dt);
		updateData(entity, dt);
	}

	function updateData(data: PlayerEntityData, dt: number): void {
		if (!data.target)
			return;
		const targetVector = Vector2.clone(data.target);
		if (Vector2.isZero(targetVector) || Vector2.equals(targetVector, data.transform.position))
			return;

		const positionVector = Vector2.clone(data.transform.position);

		let diffVector = Vector2.clone(targetVector);
		diffVector = Vector2.subtract(diffVector, positionVector);

		const shipSpeed = data.speed;

		let vel = Vector2.clone(diffVector);
		vel = Vector2.normalize(vel);
		vel = Vector2.multiplyScalar(vel, shipSpeed * dt / 1000);
		if (Vector2.sqrMagnitude(diffVector) <= Vector2.sqrMagnitude(vel)) {
			data.transform.position = targetVector;
			return;
		}
		const theta = Math.atan2(vel.y, vel.x);
		data.transform.angle = Math.floor(theta * (180 / Math.PI) - 90);

		const WorldSize = Screen.PlayableArea;

		const minX = data.collider.radius;
		const maxX = WorldSize.x - data.collider.radius;

		const minY = data.collider.radius;
		const maxY = WorldSize.y - data.collider.radius;

		let p = Vector2.addVector(data.transform.position, vel);
		p = Vector2.clamp(p, minX, maxX, minY, maxY);

		data.transform.position = p;
	}

	export function onTakeDamage(entityData: PlayerEntityData, src: EntityData, damage: number, state: GameState) {
		if (entityData.heal && entityData.heal > 0) {
			if (damage > entityData.heal) {
				damage -= entityData.heal;
				entityData.health += entityData.heal;
				entityData.heal = undefined;
			}
			else {
				entityData.heal -= damage;
				entityData.health += damage;
				damage = 0;
			}
		}

		if (entityData.absorb && entityData.absorb > 0) {
			entityData.absorb -= damage;
			if (entityData.absorb < 0) {
				damage = -entityData.absorb;
				entityData.absorb = undefined;
			}
		}

		if (damage <= 0)
			return;

		entityData.health -= damage;
		if (isEnemy(src))
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.PlayerInvulnerabilityTimer.collision;
		else
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.PlayerInvulnerabilityTimer.projectile;
	}

	export function onCollide(entityData: PlayerEntityData, other: EntityData, state: GameState): void {
		if (isEnemy(other)) {
			let damage = GlobalGameParameters.EnemyCollisionDamage;
			if (entityData.armor && entityData.armor > 0) {
				entityData.armor -= damage;
				if (entityData.armor < 0) {
					damage = -entityData.armor;
					entityData.armor = undefined;
				}
			}

			if (damage <= 0)
				return;

			PlayerSystem.onTakeDamage(entityData, other, damage, state);
		}
	}

	export function levelTransition(entityData: PlayerEntityData) {
	}

	export function enemyKilled(playerId: EntityId, enemyEntity: EnemyEntityData, state: GameState) {
		const scoreGain = Math.floor(enemyEntity.maxHealth / 2);
		AddScoreToPlayer(playerId, scoreGain, enemyEntity.transform.position, state);

		var abilities = state.playerAbilities[playerId].abilities.filter(x => x.cooldown > 0);
		if (abilities.length > 0) {
			var active = Math.floor(Math.random() * abilities.length);
			abilities[active].cooldown -= 500;
		}
	}
}