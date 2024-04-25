import { Screen } from "../rendering/screen";
import { EntityData, EntitySystem, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { CircBody } from "./transform";
import { GameState } from "../game/game";
import { isEnemy } from "./enemy";
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
		damage = AuraSystem.ApplyDamageDealtModifiers(src, damage);
		damage = AuraSystem.ApplyDamageTakenModifiers(entityData, damage);

		entityData.health -= damage;
		if (isEnemy(src))
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.PlayerInvulnerabilityTimer.collision;
		else
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.PlayerInvulnerabilityTimer.projectile;
	}

	export function onCollide(entityData: PlayerEntityData, other: EntityData, state: GameState): void {
		if (isEnemy(other)) {
			PlayerSystem.onTakeDamage(entityData, other, GlobalGameParameters.EnemyCollisionDamage, state);
		}
	}

	export function levelTransition(entityData: PlayerEntityData) {

	}
}