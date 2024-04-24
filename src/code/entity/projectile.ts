import { GetEquipmentData } from "../databases/equipdatabase";
import { Destroy, GameState, NextEntityId, TeamId } from "../game/game";
import { V2, Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { WeaponProjectileData } from "../types/shipdata";
import { EnemyEntityData, EnemySystem, isEnemy } from "./enemy";
import { EntityData, EntitySystem } from "./entity";
import { PlayerEntityData, PlayerSystem, isPlayer } from "./player";
import { Body } from "./transform";

export interface ProjectileData extends EntityData {
	collider: Body;
	type: number;
	team: TeamId;
	owner: EntityId;
	damage: number;
	life: number;
	motion: ProjectileMotion;
	pierce?: number;
	target?: EntityId;
}

export enum ProjectileMotion {
	Flat = 0,
	Tracked = 1
}

export function isProjectile(object: any): object is ProjectileData {
	return (object as ProjectileData).team !== undefined;
}

export module ProjectileSystem {

	export function CreateProjectile(proj: WeaponProjectileData, position: V2, target: EntityId, owner: EntityId, state: GameState) {

		let team = TeamId.Neither;
		let targetEntity: EntityData;

		if (target in state.players) {
			team = TeamId.Enemy;
			targetEntity = state.players[target];
		}
		else if (target in state.enemies) {
			team = TeamId.Player;
			targetEntity = state.enemies[target];
		}
		else
			return;

		const angle = (targetEntity.transform.angle + 90) * Math.PI / 180;
		const fwd = Vector2.multiplyScalar(Vector2.makeVector(Math.cos(angle), Math.sin(angle)), 64);
		const targetPos = Vector2.clone(targetEntity.transform.position);
		const fwdPos = Vector2.addVector(fwd, targetPos);

		const spread = ((Math.random() * 2 - 1) * proj.spread * Math.PI / 180);
		const spawnAngle = Vector2.vectorAngle(Vector2.subtract(fwdPos, position)) + spread;

		const id = NextEntityId(state);
		const newProjectile = {
			id: id,
			transform: {
				position: position,
				angle: spawnAngle,
				scale: 1
			},
			owner: owner,
			team: team,
			type: proj.type,
			target: target,
			life: proj.life,
			motion: proj.motion,
			speed: proj.speed,
			damage: proj.damage,
			pierce: proj.pierce,
			collider: {
				center: Vector2.zero()
			}
		};

		state.projectiles[id] = newProjectile;
	}

	export function onUpdate(entityData: ProjectileData, state: GameState, dt: number) {
		entityData.life -= dt;
		if (entityData.life <= 0) {
			Destroy(state, entityData.id);
			return;
		}

		if (entityData.motion == ProjectileMotion.Tracked) {
			const target = entityData.target;
			if (target) {
				let targetPos: V2;
				if (target in state.enemies) {
					targetPos = Vector2.clone(state.enemies[target].transform.position);
				}
				else if (target in state.players) {
					targetPos = Vector2.clone(state.players[target].transform.position);
				}
				else {
					entityData.motion = ProjectileMotion.Flat;
					return;
				}

				const theta = Vector2.angleBetween(targetPos, entityData.transform.position);
				entityData.transform.angle = theta;
			}
		}

		const ang = entityData.transform.angle;
		const dir = Vector2.multiplyScalar(Vector2.makeVector(Math.cos(ang), Math.sin(ang)), (dt * entityData.speed) / 1000);
		const pos = Vector2.addVector(entityData.transform.position, dir);

		const bounds = Screen.PlayableArea;
		if (pos.x < 0 || pos.x > bounds.x || pos.y < 0 || pos.y > bounds.y) {
			Destroy(state, entityData.id);
			return;
		}

		entityData.transform.position = pos;
	}

	export function onCollide(entityData: ProjectileData, other: EntityData, state: GameState): void {
		if (isPlayer(other)) {
			onPlayerCollide(entityData, other as PlayerEntityData, state);
		}
		else if (isEnemy(other)) {
			onEnemyCollide(entityData, other as EnemyEntityData, state);
		}

		if (entityData.pierce && entityData.pierce > 0) {
			entityData.pierce -= 1;
			entityData.damage *= 0.6;
			return;
		}

		Destroy(state, entityData.id);
	}

	function onPlayerCollide(projectile: ProjectileData, player: PlayerEntityData, state: GameState) {
		if (projectile.team === TeamId.Player)
			return;

		const data = GetEquipmentData(projectile.type).weapon?.projectile;
		PlayerSystem.onTakeDamage(player, projectile, data!.damage, state);
	}

	function onEnemyCollide(projectile: ProjectileData, enemy: EnemyEntityData, state: GameState) {
		if (projectile.team === TeamId.Enemy)
			return;

		const data = GetEquipmentData(projectile.type).weapon?.projectile;
		EnemySystem.onTakeDamage(enemy, projectile, data!.damage, state);
	}
}