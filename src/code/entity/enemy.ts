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
import { ProjectileData, isProjectile } from "./projectile";
import { GetEquipmentData } from "../databases/equipdatabase";
import { EquipSystem } from "./equip";
import { DropSystem } from "./drop";
import { AuraSystem } from "../aura/aura";

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
		const pts = Curve.getCurvePoints(path);

		for (var len = 0, i = 0; i < pts.length - 2; i += 2) {
			if (pts[i] === 0 && pts[i + 1] === 0)
				break;
			len += dist(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
		}

		return { Path: pts, TotalDistance: len, idx: 0 };
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

		let nextPos = getXY(pts, Math.min(distance + 10, path.TotalDistance - 1));
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
	path: number;
	time: number;
	seed: number;
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

		let distance = entityData.time / 1000;

		const path = state.enemyPathData[entityData.path];
		if (!path) {
			console.error(`Enemy path ${entityData.path} is not valid`);
			return;
		}

		if (distance >= path.TotalDistance) {
			ResetPath(entityData, state);
			return;
		}

		const pos = EnemyPath.GetPoint(path, distance, entityData.seed);

		entityData.transform.position = pos.Position;
		entityData.transform.angle = pos.Heading;
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

			Game.Destroy(state, entityData.id);
			return;
		}
	}

	export function onCollide(entityData: EnemyEntityData, other: EntityData, state: GameState): void {

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

		const path = Math.floor(seed * state.pathCount);

		const playerCount = state.playerCount;
		const hp = (shipData.baseHealth || 50) * (1 + Math.max(0, (playerCount-1) * 0.5));

		const entityData: EnemyEntityData = {
			id: id,
			transform: {
				position: { x: 0, y: 0 },
				angle: 3 * Math.PI / 2,
				scale: 1,
			},
			shipData: ship,
			health: hp,
			maxHealth: hp,
			collider: (shipData.collider as CircBody),
			path: path,
			time: 0,
			seed: shortSeed,
			speed: shipData.speed!,
			auras: []
		};

		state.enemies[entityData.id] = entityData;

		const equipData = GetEquipmentData(shipData.defaultWeapon!);
		EquipSystem.CreateEquipment(equipData, id, state);
	}
}