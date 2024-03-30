import { Destroy, GameState, NextEntityId, Systems, TeamId } from "../game/game";
import { V2, Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";
import { WeaponProjectileData } from "../types/shipdata";
import { EnemyEntityData, isEnemy } from "./enemy";
import { EntityData, EntitySystem } from "./entity";
import { PlayerEntityData, isPlayer } from "./player";
import { Body } from "./transform";

export interface ProjectileData extends EntityData {
	collider: Body,
	type: number,
	team: TeamId,
	damage: number,
	speed: number,
	target: EntityId,
}

export function isProjectile(object: any): object is ProjectileData {
	return 'team' in object;
}

export class ProjectileSystem extends EntitySystem<ProjectileData> {

	public CreateProjectile(proj: WeaponProjectileData, position: V2, target: EntityId, state: GameState) {

		let team = TeamId.Neither;
		let targetPosition: V2 = Vector2.zero();

		if (target in state.players) {
			team = TeamId.Enemy;
			targetPosition = state.players[target].transform.position;
		}
		else if (target in state.enemies) {
			team = TeamId.Player;
			targetPosition = state.enemies[target].transform.position;
		}

		const angle = Vector2.asVector2(position).subtract(targetPosition).angle();

		const id = NextEntityId(state);
		const newProjectile = {
			id: id,
			transform: {
				position: position,
				angle: angle,
				scale: 1
			},
			team: team,
			type: proj.type,
			damage: proj.damage,
			speed: proj.speed,
			target: target,
			collider: {
				center: Vector2.zero()
			}
		};

		state.projectiles[id] = newProjectile;

		console.log(`created projectile: ${JSON.stringify(newProjectile)}`);
	}

	public onUpdate(entityData: ProjectileData, state: GameState, dt: number) {
		const ang = entityData.transform.angle;
		const dir = new Vector2(Math.cos(ang), Math.sin(ang)).multiplyScalar((dt * entityData.speed) / 1000);
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
		
		Destroy(entityData.id);
	}

	public onPlayerCollide(projectile: ProjectileData, player: PlayerEntityData, state: GameState) {
		if ((projectile.team & TeamId.Player) === 0)
			return;

		Systems.player.onTakeDamage(player, projectile, projectile.damage, state);
	}

	public onEnemyCollide(projectile: ProjectileData, enemy: EnemyEntityData, state: GameState) {
		if ((projectile.team & TeamId.Enemy) === 0)
			return;

		Systems.enemy.onTakeDamage(enemy, projectile, projectile.damage, state);
	}
}