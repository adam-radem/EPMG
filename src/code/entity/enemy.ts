import * as Game from "../game/game";
import { CircBody } from "./transform";
import { EntityData, ShipEntity } from "./entity";
import { Curve } from "./Curve";
import { V2, Vector2 } from "../math/vector";
import { GetShipType, ShipEquipment } from "../types/shipdata";
import { GameState } from "../game/game";
import { GetShipData } from "../databases/shipdatabase";
import { GlobalGameParameters } from "../game/static";
import { PlayerSystem, isPlayer } from "./player";
import { ProjectileCreationData, ProjectileData, ProjectileSystem, isProjectile } from "./projectile";
import { GetEquipmentData } from "../databases/equipdatabase";
import { EquipSystem } from "./equip";
import { DropSystem } from "./drop";
import { AuraSystem } from "../aura/aura";
import { Screen } from "../rendering/screen";
import { CreateProjectile } from "../rendering/renderFactory";

export interface Path {
	Path: number[];
	idx: number;
	TotalDistance: number;
}

interface PathPoint {
	Position: V2,
	Heading: number;
}

function dist(x1: any, y1: any, x2: any, y2: any): number {
	var dx = x2 - x1,
		dy = y2 - y1;
	return Math.sqrt(dx * dx + dy * dy);
}
function getXY(points: any, pos: any): V2 {
	var len = 0, lastLen, i, l = points.length;

	// find segment
	for (i = 2; i < l; i += 2) {
		lastLen = dist(points[i], points[i + 1], points[i - 2], points[i - 1]);

		len += lastLen;
		if (pos < len && lastLen) {
			len -= lastLen;
			pos -= len;

			return {
				x: points[i - 2] + (points[i] - points[i - 2]) * (pos / lastLen),
				y: points[i - 1] + (points[i + 1] - points[i - 1]) * (pos / lastLen)
			};
		}
	}

	return Vector2.zero();
}
export class EnemyPath {

	public static GetPath(points: V2[]): Path {
		if (points.length == 1) {
			return { Path: [points[0].x, points[0].y], TotalDistance: 0, idx: -1 };
		}

		let path = [];
		for (let i = 0; i < points.length; ++i) {
			path.push(points[i].x, points[i].y);
		}
		const pts = Curve.getCurvePoints(path, 0.5, 32, false);
		const pointArray = [];

		for (var len = 0, i = 0; i < pts.length - 2; i += 2) {
			if (pts[i] === 0 && pts[i + 1] === 0) {
				break;
			}
			pts[i] = Math.floor(pts[i]);
			pts[i + 1] = Math.floor(pts[i + 1]);
			pointArray.push(pts[i]);
			pointArray.push(pts[i + 1]);
			len += dist(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
		}

		return { Path: pointArray, TotalDistance: len, idx: 0 };
	}

	public static GetPoint(path: Path, distance: number, seed: number): PathPoint {
		let posX = path.Path[0];
		let posY = path.Path[1];
		let heading = 270;

		if (path.Path.length == 1 || distance === 0) {
			return { Position: { x: posX, y: posY }, Heading: heading };
		}

		const pts = path.Path;

		let pathPos = getXY(pts, distance);
		pathPos = Vector2.addVector(pathPos, { x: 0, y: Math.sin(seed + distance / 1000) * 100 });

		let nextPos = getXY(pts, Math.min(distance + 30, path.TotalDistance));
		nextPos = Vector2.addVector(nextPos, { x: 0, y: Math.sin(seed + (distance + 10) / 1000) * 100 });

		let vec = Vector2.makeVector(nextPos.x, nextPos.y);
		vec = Vector2.subtract(vec, Vector2.makeVector(pathPos?.x, pathPos?.y));
		vec = Vector2.normalize(vec);
		const theta = Math.atan2(vec.y, vec.x);
		heading = Math.floor(theta * (180 / Math.PI) - 90);

		return { Position: { x: pathPos?.x, y: pathPos?.y }, Heading: heading };
	}
}

export interface EnemyEntityData extends ShipEntity {
	collider: CircBody;
	motion: number;
	path: number;
	time: number;
	seed: number;
}

enum EnemyMotion {
	Path = 0,
	Horizontal = 1,
	Vertical = 2,
	Forward = 3,
	Chase = 4,
	Spinner = 5
}

enum EnemyDeathEffect {
	None = 0,
	Asteroid = 1,
	BulletMine = 2,
	LaserMine = 3
}
function isMine(effect: EnemyDeathEffect) {
	return effect === EnemyDeathEffect.BulletMine ||
		effect === EnemyDeathEffect.LaserMine;
}

export function isEnemy(object: EntityData): object is EnemyEntityData {
	return (object as EnemyEntityData).path !== undefined;
}

function ResetPath(entityData: EnemyEntityData, state: GameState) {
	entityData.time = 0;

	const newSeed = Math.random();
	entityData.seed = Math.floor(newSeed * 65535);

	const pathIdx = Math.floor(newSeed * state.pathCount);
	entityData.path = pathIdx;
}

export module EnemySystem {
	export function onUpdate(entityData: EnemyEntityData, state: GameState, dt: number): void {
		if (entityData.health <= 0) {
			Game.Destroy(state, entityData.id);
			return;
		}

		AuraSystem.onUpdate(entityData, state, dt);

		const speed = entityData.speed;
		entityData.time += dt * speed;

		switch (entityData.motion) {
			case EnemyMotion.Path:
				updatePath(entityData, state, dt);
				break;
			case EnemyMotion.Spinner:
				updatePath(entityData, state, dt);
				entityData.transform.angle = (entityData.time / 10000);
				break;
			case EnemyMotion.Horizontal:
				if (entityData.seed < (65535 / 2))
					moveVector(entityData, state, dt, { x: -1, y: 0 });
				else
					moveVector(entityData, state, dt, { x: 1, y: 0 });
				moveAngle(entityData, state, dt);
				break;
			case EnemyMotion.Vertical:
				moveVector(entityData, state, dt, { x: 0, y: 1 });
				moveAngle(entityData, state, dt);
				break;
			case EnemyMotion.Forward:
				const angle = entityData.transform.angle;
				const fwd = Vector2.makeVector(Math.cos(angle), Math.sin(angle));
				moveVector(entityData, state, dt, Vector2.normalize(fwd));
				break;
			case EnemyMotion.Chase:
				moveChase(entityData, state, dt);
				break;
		}
	}

	function updatePath(entityData: EnemyEntityData, state: GameState, dt: number): void {
		let distance = entityData.time / 1000;

		const path = state.enemyPathData[entityData.path];
		if (!path) {
			console.error(`Enemy path ${entityData.path} is not valid`);
			return;
		}

		if (distance >= path.TotalDistance) {
			ResetPath(entityData, state);
			updatePath(entityData, state, dt);
			return;
		}

		const pos = EnemyPath.GetPoint(path, distance, entityData.seed);

		entityData.transform.position = pos.Position;
		entityData.transform.angle = pos.Heading;
	}

	function moveAngle(entityData: EnemyEntityData, state: GameState, dt: number): void {
		const ang = entityData.time / 2000 + entityData.seed / 65535;
		entityData.transform.angle = ang;
	}

	function moveVector(entityData: EnemyEntityData, state: GameState, dt: number, vector: V2): void {
		var dist = Vector2.multiplyScalar(vector, (entityData.speed * dt) / 1000);
		var newPos = Vector2.addVector(entityData.transform.position, dist);
		entityData.transform.position = newPos;

		var bounds = Screen.PlayableArea;
		if (newPos.y < -50 || newPos.y > bounds.y - 50) {
			Game.Destroy(state, entityData.id);
		}
		if (newPos.x < -50) {
			newPos.x = bounds.x + 50;
		}
		if (newPos.x > bounds.x + 50) {
			newPos.x = -50;
		}
	}

	function moveChase(entityData: EnemyEntityData, state: GameState, dt: number): void {
		const livingPlayers = [];
		for (const player in state.players) {
			if (state.players[player].health >= 0)
				livingPlayers.push(player);
		}

		const targetIdx = Math.floor((entityData.seed / 65535) * livingPlayers.length);
		const target = livingPlayers[targetIdx];
		const targetPosition = state.players[target].transform.position;
		const targetVec = Vector2.subtract(targetPosition, entityData.transform.position);
		const theta = Math.atan2(targetVec.y, targetVec.x);

		const normalized = Vector2.normalize(targetVec);
		const dist = Vector2.multiplyScalar(normalized, (entityData.speed * dt / 1000));
		if (Vector2.sqrMagnitude(dist) > Vector2.sqrMagnitude(targetVec)) {
			entityData.transform.position = targetPosition;
		}
		else {
			const newPos = Vector2.addVector(entityData.transform.position, dist);
			entityData.transform.position = newPos;
		}

		entityData.transform.angle = Math.floor(theta * (180 / Math.PI) - 90);
	}

	export function onTakeDamage(entityData: EnemyEntityData, src: EntityData, damage: number, state: GameState) {
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

		if (isPlayer(src))
			entityData.collider.disabledUntil = state.time + GlobalGameParameters.EnemyInvulnerabilityTime.collision;

		if (entityData.health <= 0) {
			let entityPlayer = undefined;
			if (isProjectile(src)) {
				entityPlayer = (src as ProjectileData).owner;
			}
			else if (isPlayer(src)) {
				entityPlayer = src.id;
			}

			if (entityPlayer) {
				PlayerSystem.enemyKilled(entityPlayer, entityData, state);
				DropSystem.tryCreateDrop(entityData, state);
			}

			const shipData = GetShipData(entityData.shipData);
			if (shipData.enemyDeath) {
				ApplyDeathEffect(entityData, shipData.enemyDeath, state);
			}

			Game.Destroy(state, entityData.id);
			return;
		}
	}

	function ApplyDeathEffect(entityData: EnemyEntityData, effect: EnemyDeathEffect, state: GameState) {
		switch (effect) {
			case EnemyDeathEffect.None:
				return;
			case EnemyDeathEffect.Asteroid:
				const spawnPos = entityData.transform.position;
				const count = Math.ceil((entityData.seed / 65535) * 2);
				const angDiff = Math.PI / (count * 4);
				const baseAng = (Math.PI / 2) + ((angDiff * count) / 2);

				for (let i = 0; i <= count; ++i) {
					const newEnemy = CreateEnemy(8, state);
					newEnemy.transform.angle = baseAng - (angDiff * i);
					newEnemy.transform.position = spawnPos;
				}
				break;
			case EnemyDeathEffect.BulletMine:
			case EnemyDeathEffect.LaserMine:
				const weaponId = 100 + effect; //Bullet = 102, Laser = 103
				const weapon = GetEquipmentData(weaponId);
				if (!weapon.weapon)
					return;
				const projCount = 4 + ((effect - 2) * 4); //Bullet = 4, Laser = 8
				const proj: ProjectileCreationData = {
					proj: weapon.weapon.projectile!,
					mods: {},
					position: entityData.transform.position,
					angle: 0,
					owner: entityData.id,
					team: Game.TeamId.Enemy
				};
				for (let i = 1; i <= projCount; ++i) {
					const angOffset = (entityData.seed < 65535 / 2) ? 0 : (Math.PI / 4);
					proj.angle = angOffset + (i * Math.PI / (projCount / 2));
					ProjectileSystem.CreateProjectile(proj, state);
				}
				break;
		}
	}

	export function onCollide(entityData: EnemyEntityData, other: EntityData, state: GameState): void {
		const shipData = GetShipData(entityData.shipData);
		if (isMine(shipData.enemyDeath!)) {
			ApplyDeathEffect(entityData, shipData.enemyDeath, state);
			Game.Destroy(state, entityData.id);
		}
	}

	export function CreatePath(state: GameState, points: V2[]): number {
		const idx = state.pathCount;
		const path = EnemyPath.GetPath(points);
		path.idx = state.pathCount;
		state.enemyPathData[idx] = path;
		state.pathCount = idx + 1;
		return idx;
	}

	export function CreateEnemy(ship: ShipEquipment, state: GameState) {
		const shipData = GetShipData(GetShipType(ship));

		const id = Game.NextEntityId(state);
		const seed = Math.random();
		const shortSeed = Math.floor(seed * 65535);
		let spriteIdx = 0;
		if (shipData.sprites)
			spriteIdx = Math.floor(seed * shipData.sprites.length);

		const path = Math.floor(seed * state.pathCount);

		const playerCount = state.playerCount;
		const hp = (shipData.baseHealth || 50) * (1 + Math.max(0, (playerCount - 1) * 0.5));

		const bounds = Screen.PlayableArea;
		const startPos: V2 = { x: 0, y: 0 };
		let startAngle = 270;
		const motionType = shipData.enemyMotion ?? EnemyMotion.Path;
		if (motionType == EnemyMotion.Horizontal) {
			// Spawn in the top 3rd of the screen
			if (seed < 0.5) {
				startPos.x = bounds.x;
				startAngle = 90;
			}
			startPos.y = 100 + (seed * (bounds.y / 3));
		}
		else if (motionType === EnemyMotion.Vertical) {
			startPos.x = 90 + (seed * (bounds.x - 180));
			startPos.y = 0;
		}
		else if (motionType === EnemyMotion.Chase) {
			startPos.x = 90 + (seed * (bounds.x - 180));
			startPos.y = 0;
		}

		const entityData: EnemyEntityData = {
			id: id,
			transform: {
				position: startPos,
				angle: startAngle,
				scale: 1,
			},
			shipData: ship + (spriteIdx << 4),
			health: hp,
			maxHealth: hp,
			collider: (shipData.collider as CircBody),
			path: path,
			time: 0,
			seed: shortSeed,
			motion: motionType,
			speed: shipData.speed!,
			auras: []
		};

		state.enemies[entityData.id] = entityData;
		if (shipData.weapon) {
			const equipData = GetEquipmentData(shipData.weapon!);
			EquipSystem.CreateEquipment(equipData, id, state);
		}

		return entityData;
	}
}