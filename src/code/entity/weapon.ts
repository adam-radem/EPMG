import { CreateProjectile, Destroy, GameState, NextEntityId } from "../game/game";
import { EntityData, EntitySystem } from "./entity";
import { GetEquipmentData } from "../databases/equipdatabase";
import { ShipEquipmentData, WeaponEquipmentData } from "../types/shipdata";
import { V2, Vector2 } from "../math/vector";

export interface EquipData extends EntityData {
	type: number;
	time: number;
	owner: EntityId;
	lastTarget: EntityId;
}

export class EquipSystem extends EntitySystem<EquipData> {
	public CreateEquipment(equipData: ShipEquipmentData, ownerId: EntityId, state: GameState) {
		const id = NextEntityId(state);
		const parent = state.players[ownerId] || state.enemies[ownerId];
		const parentPos = Vector2.asVector2(parent.transform.position);

		state.equipment[id] = {
			id: id,
			transform: {
				position: parentPos.add(equipData.anchor),
				angle: 0,
				scale: 1
			},
			type: equipData.type,
			time: 0,
			owner: ownerId,
			lastTarget: 0
		};
	}


	public onUpdate(entityData: EquipData, state: GameState, dt: number) {
		const equipData = GetEquipmentData(entityData.type);

		const parent = state.players[entityData.owner] || state.enemies[entityData.owner];
		const parentPos = Vector2.asVector2(parent.transform.position);
		entityData.transform.position = parentPos.add(equipData.anchor);

		if (entityData.time > 0) {
			entityData.time -= dt;
			return;
		}

		this.updateWeapon(entityData, equipData, state, dt);
	}

	private updateWeapon(entityData: EquipData, equipData: ShipEquipmentData, state: GameState, dt: number) {

		if (!equipData.weapon)
			return;

		if (entityData.owner in state.players) {
			this.updatePlayerWeapon(entityData, equipData.weapon, state);
			return;
		}

		if (entityData.owner in state.enemies) {
			this.updateEnemyWeapon(entityData, equipData.weapon, state);
			return;
		}
	}

	private updatePlayerWeapon(entityData: EquipData, weaponData: WeaponEquipmentData, state: GameState) {
		const playerData = state.players[entityData.owner];

		//this player left the game
		if (!playerData) {
			Destroy(entityData.id);
			return;
		}

		//This player is current dead
		if (playerData.health <= 0) {
			return;
		}

		const target = entityData.lastTarget;
		if (target && target in state.enemies) {
			const enemyData = state.enemies[target];
			if (this.weaponInRange(entityData.transform.position, enemyData.transform.position, weaponData.range)) {
				this.fireWeapon(entityData, weaponData, target, state);
				return;
			}
		}

		//Look for a new target in range
		const minDist = { target: "", dist: Infinity };
		for (const enemyId in state.enemies) {
			const enemyData = state.enemies[enemyId];
			const dist = this.distanceTo(entityData.transform.position, enemyData.transform.position);
			if (dist < minDist.dist && this.inRange(dist, weaponData.range)) {
				minDist.target = enemyId;
				minDist.dist = dist;
			}
		}

		//Found a new target to fire at
		if (minDist.target) {
			this.fireWeapon(entityData, weaponData, minDist.target, state);
		}
	}

	private updateEnemyWeapon(entityData: EquipData, weaponData: WeaponEquipmentData, state: GameState) {
		const enemyData = state.enemies[entityData.owner];
		//Enemy is dead or removed from the map
		if (!enemyData || enemyData.health <= 0) {
			Destroy(entityData.id);
			return;
		}

		//Find the closest player and fire the weapon at them
		const minDist = { target: "", dist: Infinity };
		for (const playerId in state.players) {
			const playerData = state.players[playerId];
			const dist = this.distanceTo(entityData.transform.position, playerData.transform.position);
			if (dist < minDist.dist) {
				minDist.target = playerId;
				minDist.dist = dist;
			}
		}

		if (minDist.target) {
			this.fireWeapon(entityData, weaponData, minDist.target, state);
		}
	}

	private distanceTo(weaponPosition: V2, targetPosition: V2) {
		return Vector2.asVector2(weaponPosition).subtract(targetPosition).sqrMagnitude();
	}

	private weaponInRange(weaponPosition: V2, targetPosition: V2, range: number) {
		const dist = this.distanceTo(weaponPosition, targetPosition);
		return this.inRange(dist, range);
	}

	private inRange(distance: number, range: number) {
		return distance < (range * range);
	}

	private fireWeapon(entityData: EquipData, weaponData: WeaponEquipmentData, target: EntityId, state: GameState) {
		entityData.lastTarget = target;
		entityData.time = weaponData.cooldown;

		if (weaponData.projectile) {
			CreateProjectile(weaponData.projectile, entityData.transform.position, target, state);
		}
	}
}