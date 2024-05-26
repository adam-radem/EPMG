import { GetEquipmentData } from "../databases/equipdatabase";
import { ShipEntity } from "../entity/entity";
import { ProjectileCreationData, ProjectileSystem } from "../entity/projectile";
import { GameState, TeamId } from "../game/game";
import { Vector2 } from "../math/vector";
import { Aura } from "./aura";
import { AuraCallbacks } from "./auraEffects";

function FireWeaponAtAllInRange(entity: ShipEntity, aura: Aura, state: GameState) {
	const srcPos = entity.transform.position;
	const weaponData = GetEquipmentData(aura.value).weapon;
	if (!weaponData || !weaponData.projectile) {
		console.error("Special weapon is incorrectly defined. Did not find weapon " + aura.value);
		return;
	}
	const range = weaponData.range * weaponData.range;
	for (const eid in state.enemies) {
		const enemyData = state.enemies[eid];

		if (Vector2.sqrMagnitude(Vector2.subtract(srcPos, enemyData.transform.position)) > range)
			continue;

		const proj: ProjectileCreationData = {
			proj: weaponData.projectile!,
			mods: {},
			position: srcPos,
			target: enemyData.id,
			owner: entity.id,
			team: TeamId.Player
		};
		ProjectileSystem.CreateProjectile(proj, state);
	}
}

function ExtraLasersUpdate(entity: ShipEntity, aura: Aura, state: GameState, dt: number) {
	if (aura.flag && aura.flag < state.time)
		return;

	const srcPos = entity.transform.position;
	const weaponData = GetEquipmentData(aura.value).weapon;
	if (!weaponData || !weaponData.projectile) {
		console.error("Special weapon is incorrectly defined. Did not find weapon " + aura.value);
		return;
	}
	const range = weaponData.range * weaponData.range;

	const minDist = { target: "", dist: Infinity };
	for (const enemyId in state.enemies) {
		const enemyData = state.enemies[enemyId];
		const dist = Vector2.sqrMagnitude(Vector2.subtract(entity.transform.position, enemyData.transform.position));
		if (dist < minDist.dist && (dist <= range)) {
			minDist.target = enemyId;
			minDist.dist = dist;
		}
	}

	if (minDist.target) {
		const proj: ProjectileCreationData = {
			proj: weaponData.projectile!,
			mods: {},
			position: srcPos,
			target: minDist.target,
			owner: entity.id,
			team: TeamId.Player
		};
		ProjectileSystem.CreateProjectile(proj, state);

		aura.flag = state.time + weaponData.cooldown;
	}
}

function SpreadMissilesCreate(entity: ShipEntity, aura: Aura, state: GameState) {
	FireWeaponAtAllInRange(entity, aura, state);
}

function ScreenNukeCreate(entity: ShipEntity, aura: Aura, state: GameState) {
	FireWeaponAtAllInRange(entity, aura, state);
}

export const ExtraLasers: AuraCallbacks = {
	update: ExtraLasersUpdate
};
export const SpreadMissiles: AuraCallbacks = {
	onCreate: SpreadMissilesCreate
};
export const ScreenNuke: AuraCallbacks = {
	onCreate: ScreenNukeCreate
};