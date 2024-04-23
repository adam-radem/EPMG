import * as Game from "../game/game";
import { CircBody } from "./transform";
import { EntityData, EntitySystem, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { ShipEquipment } from "../types/shipdata";
import { GameState } from "../game/game";
import { GetShipData } from "../databases/shipdatabase";
import { getCurvePoints } from "cardinal-spline-js";
import { GlobalGameParameters } from "../game/static";
import { PlayerEntityData, isPlayer } from "./player";
import { ProjectileData, isProjectile } from "./projectile";
import { GetEquipmentData } from "../databases/equipdatabase";

const pathCache: any = {};
function GetPointsForPath(path: Path) {
	if (pathCache[path.idx]) {
		return pathCache[path.idx];
	}

	let pathPoints = [];
	for (let i = 0; i < path.Path.length; ++i) {
		pathPoints.push(path.Path[i].x, path.Path[i].y);
	}

	const pts = getCurvePoints(pathPoints);
	pathCache[path.idx] = pts;

	return pts;
}

export interface Path {
	Path: V2[];
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
function getXY(points: any, pos: any) {
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

	return null;
}
export class EnemyPath {

	public static GetPath(points: V2[]): Path {
		if (points.length == 1) {
			return { Path: points, TotalDistance: 0, idx: -1 };
		}

		let path = [];
		for (let i = 0; i < points.length; ++i) {
			path.push(points[i].x, points[i].y);
		}

		const pts = getCurvePoints(path);

		for (var len = 0, i = 0; i < pts.length - 2; i += 2) {
			len += dist(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
		}

		return { Path: points, TotalDistance: len, idx: 0 };
	}

	public static GetPoint(path: Path, distance: number, seed: number): PathPoint {
		let pos = path.Path[0];
		let heading = 270;

		if (path.Path.length == 1 || distance === 0) {
			return { Position: pos, Heading: heading };
		}

		const pts = GetPointsForPath(path);

		let pathPos = getXY(pts, distance);
		pathPos = Vector2.asVector2(pathPos!).add({ x: 0, y: Math.sin(seed + distance / 1000) * 100 });

		let nextPos = getXY(pts, Math.min(distance + 10, path.TotalDistance - 1));
		nextPos = Vector2.asVector2(nextPos!).add({ x: 0, y: Math.sin(seed + (distance + 10) / 1000) * 100 });

		const vec = new Vector2(nextPos?.x, nextPos?.y);
		vec.subtract(new Vector2(pathPos?.x, pathPos?.y)).normalize();
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

export class EnemySystem extends EntitySystem<EnemyEntityData> {
	public onUpdate(entityData: EnemyEntityData, state: GameState, dt: number): void {
		if (entityData.health <= 0) {
			Game.Destroy(entityData.id);
			return;
		}

		const speed = entityData.speed;
		entityData.time += dt * speed;

		let distance = entityData.time / 1000;

		const path = state.enemyPathData[entityData.path];
		if (!path) {
			console.error(`Enemy path ${entityData.path} is not valid`);
			return;
		}

		if (distance >= path.TotalDistance) {
			this.ResetPath(entityData, state);
			return;
		}

		const pos = EnemyPath.GetPoint(path, distance, entityData.seed);

		entityData.transform.position = pos.Position;
		entityData.transform.angle = pos.Heading;
	}

	public onTakeDamage(entityData: EnemyEntityData, src: EntityData, damage: number, state: GameState) {
		damage = Game.Systems.aura.ApplyDamageDealtModifiers(src, damage);
		damage = Game.Systems.aura.ApplyDamageTakenModifiers(entityData, damage);

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

			if (entityPlayer)
				state.scores[entityPlayer] += 100;

			Game.Destroy(entityData.id);
			return;
		}
	}

	public ResetPath(entityData: EnemyEntityData, state: GameState) {
		const newSeed = Math.random();
		entityData.seed = Math.floor(newSeed * 65535);

		const paths = Object.keys(state.enemyPathData);
		const path = Math.floor(newSeed * paths.length);

		entityData.path = parseInt(paths[path]);
		entityData.time = 0;
	}

	public static CreatePath(state: GameState, points: V2[]): number {
		const idx = Game.NextEntityId(state);
		const path = EnemyPath.GetPath(points);
		path.idx = idx;
		state.enemyPathData[idx] = path;
		return idx;
	}

	public CreateEnemy(ship: ShipEquipment, state: GameState) {
		const shipData = GetShipData(ship.GetShipType());

		const id = Game.NextEntityId(state);
		const seed = Math.random();
		const shortSeed = Math.floor(seed * 65535);

		const paths = Object.keys(state.enemyPathData);
		const path = Math.floor(seed * paths.length);

		const entityData: EnemyEntityData = {
			id: id,
			transform: {
				position: { x: 0, y: 0 },
				angle: 3 * Math.PI / 2,
				scale: 1,
			},
			shipData: ship,
			health: shipData.baseHealth!,
			maxHealth: shipData.baseHealth!,
			collider: (shipData.collider as CircBody),
			path: parseInt(paths[path]),
			time: 0,
			seed: shortSeed,
			speed: shipData.speed!
		};

		state.enemies[entityData.id] = entityData;

		const equipData = GetEquipmentData(shipData.defaultWeapon!);
		Game.Systems.equip.CreateEquipment(equipData, id, state);
	}
}