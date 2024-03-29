import { Screen } from "../rendering/screen";
import { EntityData, EntitySystem, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { CircBody, RectBody } from "./transform";
import { PlayerId } from "rune-games-sdk";
import { Destroy, GameState } from "../game/game";
import { ShipSlot, Ships } from "../types/shipdata";
import { GetShipData } from "../databases/shipdatabase";
import { isEnemy } from "./enemy";
import { GlobalGameParameters } from "../game/static";

export interface PlayerEntityData extends ShipEntity {
	target: V2;
	idx: number;
	collider: CircBody;
}

export function isPlayer(other: EntityData): other is PlayerEntityData {
	return 'idx' in other;
}

export class PlayerSystem extends EntitySystem<PlayerEntityData> {
	public onUpdate(entity: PlayerEntityData, state: GameState, dt: number): void {
		if (entity.health <= 0) {
			// Destroy(entity.id);
			return;
		}

		this.updateData(entity, dt);
	}

	public updateData(data: PlayerEntityData, dt: number): void {
		if (!data.target)
			return;
		const targetVector = Vector2.asVector2(data.target);
		if (targetVector.isZero() || targetVector.equals(data.transform.position))
			return;

		const positionVector = Vector2.asVector2(data.transform.position);

		const diffVector = targetVector.clone().subtract(positionVector);

		const shipSpeed = GetShipData(data.shipData)?.speed ?? 15;

		const vel = diffVector.clone().normalize().multiplyScalar(shipSpeed * dt / 1000);
		if (diffVector.sqrMagnitude() <= vel.sqrMagnitude()) {
			data.transform.position = targetVector;
			return;
		}
		const theta = Math.atan2(vel.y, vel.x);
		data.transform.angle = Math.floor(theta * (180 / Math.PI) - 270);

		const WorldSize = Screen.PlayableArea;


		const minX = data.collider.radius;
		const maxX = WorldSize.x - data.collider.radius;

		const minY = data.collider.radius;
		const maxY = WorldSize.y - data.collider.radius;

		const position = Vector2.asVector2(data.transform.position);
		position.add(vel);
		position.clamp(minX, maxX, minY, maxY);

		data.transform.position = position;
	}

	public onTakeDamage(entityData: PlayerEntityData, src: EntityData, damage: number, state: GameState) {
		entityData.health -= damage;
		if(isEnemy(src))
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.PlayerInvulnerabilityTimer.collision;
		else
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.PlayerInvulnerabilityTimer.projectile;
	}
	public onCollide(entityData: PlayerEntityData, other: EntityData, state: GameState): void {
		if (isEnemy(other)) {
			Destroy(other.id);
			this.onTakeDamage(entityData, other, GlobalGameParameters.EnemyCollisionDamage, state);
		}
	}
}