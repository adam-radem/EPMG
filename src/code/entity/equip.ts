import { Destroy, GameState, NextEntityId, TeamId } from "../game/game";
import { EntityData } from "./entity";
import { GetEquipmentData } from "../databases/equipdatabase";
import { ShipEquipmentData, WeaponEquipmentData } from "../types/shipdata";
import { V2, Vector2 } from "../math/vector";
import { ProjectileCreationData, ProjectileSystem } from "./projectile";

export interface EquipmentModifierData {

}

export interface WeaponModifierData extends EquipmentModifierData {
	damageMod?: number;
	intervalMod?: number;
	spreadMod?: number;
	pierceMod?: number;
}

export interface EquipData extends EntityData {
	type: number;
	time: number;
	owner: EntityId;
	lastTarget: EntityId;
	modifiers: EquipmentModifierData;
}

enum WeaponTargetType {
	Targeted = 0,
	Forward = 1
}

function distanceTo(weaponPosition: V2, targetPosition: V2) {
	const vec = Vector2.subtract(Vector2.clone(weaponPosition), targetPosition);
	return Vector2.sqrMagnitude(vec);
}

function weaponInRange(weaponPosition: V2, targetPosition: V2, range: number) {
	const dist = distanceTo(weaponPosition, targetPosition);
	return inRange(dist, range);
}

function inRange(distance: number, range: number) {
	return distance < (range * range);
}

function fireWeapon(entityData: EquipData, weaponData: WeaponEquipmentData, target: EntityId, owner: EntityId, state: GameState) {
	entityData.lastTarget = target;

	const mods = entityData.modifiers as WeaponModifierData;
	const intervalMod = mods?.intervalMod || 1;
	entityData.time = weaponData.cooldown / intervalMod;

	if (weaponData.projectile) {
		const proj: ProjectileCreationData = {
			proj: weaponData.projectile,
			mods: mods,
			position: entityData.transform.position,
			owner: owner,
			team: TeamId.Neither
		};
		switch (weaponData.targetType) {
			case WeaponTargetType.Forward:
				const ownerData = state.enemies[owner];
				if (ownerData)
					proj.angle = ownerData.transform.angle;
				else
					proj.angle = 90;
				break;
			default:
				proj.target = target;
				break;
		}
		ProjectileSystem.CreateProjectile(proj, state);
	}
}

export module EquipSystem {
	export function CreateEquipment(equipData: ShipEquipmentData, ownerId: EntityId, state: GameState) {
		const id = NextEntityId(state);
		const parent = state.players[ownerId] || state.enemies[ownerId];
		const parentPos = Vector2.clone(parent.transform.position);

		state.equipment[id] = {
			id: id,
			transform: {
				position: Vector2.addVector(parentPos, equipData.anchor),
				angle: 0,
				scale: 1
			},
			speed: 0,
			type: equipData.type,
			time: 0,
			owner: ownerId,
			modifiers: {},
			lastTarget: 0
		};
	}


	export function onUpdate(entityData: EquipData, state: GameState, dt: number) {
		const equipData = GetEquipmentData(entityData.type);

		const parent = state.players[entityData.owner] || state.enemies[entityData.owner];
		if (!parent) {
			Destroy(state, entityData.id);
			return;
		}
		const parentPos = Vector2.clone(parent.transform.position);
		entityData.transform.position = Vector2.addVector(parentPos, equipData.anchor);

		if (entityData.time > 0) {
			entityData.time -= dt;
			return;
		}

		EquipSystem.updateWeapon(entityData, equipData, state, dt);
	}

	export function updateWeapon(entityData: EquipData, equipData: ShipEquipmentData, state: GameState, dt: number) {
		const weapon = equipData.weapon;
		if (!weapon)
			return;

		if (entityData.owner in state.players) {
			EquipSystem.updatePlayerWeapon(entityData, weapon, state);
			return;
		}

		if (entityData.owner in state.enemies) {
			EquipSystem.updateEnemyWeapon(entityData, weapon, state);
			return;
		}
	}

	export function updatePlayerWeapon(entityData: EquipData, weaponData: WeaponEquipmentData, state: GameState) {
		const playerData = state.players[entityData.owner];

		//this player left the game
		if (!playerData) {
			Destroy(state, entityData.id);
			return;
		}

		//This player is current dead
		if (playerData.health <= 0) {
			return;
		}

		const target = entityData.lastTarget;
		if (target && target in state.enemies) {
			const enemyData = state.enemies[target];
			if (weaponInRange(entityData.transform.position, enemyData.transform.position, weaponData.range)) {
				fireWeapon(entityData, weaponData, target, entityData.owner, state);
				return;
			}
		}

		//Look for a new target in range
		const minDist = { target: "", dist: Infinity };
		for (const enemyId in state.enemies) {
			const enemyData = state.enemies[enemyId];
			const dist = distanceTo(entityData.transform.position, enemyData.transform.position);
			if (dist < minDist.dist && inRange(dist, weaponData.range)) {
				minDist.target = enemyId;
				minDist.dist = dist;
			}
		}

		//Found a new target to fire at
		if (minDist.target) {
			fireWeapon(entityData, weaponData, minDist.target, entityData.owner, state);
		}
	}

	export function updateEnemyWeapon(entityData: EquipData, weaponData: WeaponEquipmentData, state: GameState) {
		const enemyData = state.enemies[entityData.owner];
		//Enemy is dead or removed from the map
		if (!enemyData || enemyData.health <= 0) {
			Destroy(state, entityData.id);
			return;
		}

		if (weaponData.targetType! === WeaponTargetType.Forward) {
			fireWeapon(entityData, weaponData, 0, entityData.owner, state);
			return;
		}

		//Find the closest player and fire the weapon at them
		const minDist = { target: "", dist: (weaponData.range * weaponData.range) };
		for (const playerId in state.players) {
			const playerData = state.players[playerId];
			if (playerData.health <= 0)
				continue;
			const dist = distanceTo(entityData.transform.position, playerData.transform.position);
			if (dist < minDist.dist) {
				minDist.target = playerId;
				minDist.dist = dist;
			}
		}

		if (minDist.target) {
			fireWeapon(entityData, weaponData, minDist.target, entityData.owner, state);
		}
	}
}