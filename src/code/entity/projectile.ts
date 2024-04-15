import { GetEquipmentData } from "../databases/equipdatabase";
import { Destroy, GameState, NextEntityId, Systems, TeamId } from "../game/game";
import { V2, Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { WeaponProjectileData } from "../types/shipdata";
import { EnemyEntityData, isEnemy } from "./enemy";
import { EntityData, EntitySystem } from "./entity";
import { PlayerEntityData, isPlayer } from "./player";
import { Body } from "./transform";

export interface ProjectileData extends EntityData {
	collider: Body;
	type: number;
	team: TeamId;
	owner: EntityId;
	damage: number;
	life: number;
	pierce?: number;
	target?: EntityId;
}

export enum ProjectileMotion {
	Flat = 0,
	Tracked = 1
}

export function isProjectile(object: any): object is ProjectileData {
	return 'team' in object;
}

export class ProjectileSystem extends EntitySystem<ProjectileData> {

	public CreateProjectile(proj: WeaponProjectileData, position: V2, target: EntityId, owner: EntityId, state: GameState) {

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
		const fwd = new Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(128);
		const fwdPos = fwd.clone().add(targetEntity.transform.position);

		const spread = ((Math.random() * 2 - 1) * proj.spread * Math.PI / 180);
		const spawnAngle = Vector2.asVector2(fwdPos).subtract(position).angle() + spread;

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
			speed: proj.speed,
			damage: proj.damage,
			pierce: proj.pierce,
			collider: {
				center: Vector2.zero()
			}
		};

		state.projectiles[id] = newProjectile;
	}

	public onUpdate(entityData: ProjectileData, state: GameState, dt: number) {
		entityData.life -= dt;
		if (entityData.life <= 0) {
			Destroy(entityData.id);
			return;
		}

		const data = GetEquipmentData(entityData.type).weapon?.projectile;
		if (!data) {
			Destroy(entityData.id);
			return;
		}

		if (data.motion == ProjectileMotion.Tracked) {
			const target = entityData.target;
			if (target) {
				let targetPos: Vector2;
				if (target in state.enemies) {
					targetPos = Vector2.asVector2(state.enemies[target].transform.position);
				}
				else if (target in state.players) {
					targetPos = Vector2.asVector2(state.players[target].transform.position);
				}
				else {
					data.motion = ProjectileMotion.Flat;
					return;
				}

				const theta = targetPos.subtract(entityData.transform.position).angle();
				entityData.transform.angle = theta;
			}
		}

		const ang = entityData.transform.angle;
		const dir = new Vector2(Math.cos(ang), Math.sin(ang)).multiplyScalar((dt * data.speed) / 1000);
		const pos = Vector2.asVector2(entityData.transform.position).add(dir);

		const bounds = Screen.PlayableArea;
		if (pos.x < 0 || pos.x > bounds.x || pos.y < 0 || pos.y > bounds.y) {
			Destroy(entityData.id);
			return;
		}

		entityData.transform.position = pos;
	}

	public onCollide(entityData: ProjectileData, other: EntityData, state: GameState): void {
		if (isPlayer(other)) {
			this.onPlayerCollide(entityData, other as PlayerEntityData, state);
		}
		else if (isEnemy(other)) {
			this.onEnemyCollide(entityData, other as EnemyEntityData, state);
		}

		if (entityData.pierce && entityData.pierce > 0) {
			entityData.pierce -= 1;
			entityData.damage *= 0.6;
			return;
		}

		Destroy(entityData.id);
	}

	public onPlayerCollide(projectile: ProjectileData, player: PlayerEntityData, state: GameState) {
		if (projectile.team === TeamId.Player)
			return;

		const data = GetEquipmentData(projectile.type).weapon?.projectile;
		Systems.player.onTakeDamage(player, projectile, data!.damage, state);
	}

	public onEnemyCollide(projectile: ProjectileData, enemy: EnemyEntityData, state: GameState) {
		if (projectile.team === TeamId.Enemy)
			return;

		const data = GetEquipmentData(projectile.type).weapon?.projectile;
		Systems.enemy.onTakeDamage(enemy, projectile, data!.damage, state);
	}
}