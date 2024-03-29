import * as Game from "../game/game";
import { CircBody } from "./transform";
import { EntityData, EntitySystem, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { ShipEquipment } from "../types/shipdata";
import { GameState } from "../game/game";
import { GetShipData } from "../databases/shipdatabase";
import { getCurvePoints } from "cardinal-spline-js";

export interface Path {
	Path: V2[];
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

	public static GetPath(points: V2[]) {
		if (points.length == 1) {
			return { Path: points, TotalDistance: 0 };
		}

		let path = [];
		for (let i = 0; i < points.length; ++i) {
			path.push(points[i].x, points[i].y);
		}

		const pts = getCurvePoints(path);

		for (var len = 0, i = 0; i < pts.length - 2; i += 2) {
			len += dist(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
		}

		return { Path: points, TotalDistance: len };
	}

	public static GetPoint(path: Path, distance: number): PathPoint {
		let pos = path.Path[0];
		let heading = 270;

		if (path.Path.length == 1 || distance === 0) {
			return { Position: pos, Heading: heading };
		}

		let pathPoints = [];
		for (let i = 0; i < path.Path.length; ++i) {
			pathPoints.push(path.Path[i].x, path.Path[i].y);
		}

		const pts = getCurvePoints(pathPoints);
		const pathPos = getXY(pts, distance);

		const nextPos = getXY(pts, Math.min(distance + 1, path.TotalDistance));
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
	time: number,
}

export function isEnemy(other: EntityData): other is EnemyEntityData {
	return 'path' in other;
}

export class EnemySystem extends EntitySystem<EnemyEntityData> {
	public onUpdate(entityData: EnemyEntityData, state: GameState, dt: number): void {
		if (entityData.health <= 0) {
			Game.Destroy(entityData.id);
			return;
		}

		entityData.time += dt;

		const shipData = GetShipData(entityData.shipData.GetShipType());
		const speed = shipData.speed ?? 10;
		let distance = speed * entityData.time / 1000;

		const path = state.enemyPathData[entityData.path];

		if (distance >= path.TotalDistance) {
			// Game.Destroy(entityData.id);
			distance %= path.TotalDistance;
		}

		const pos = EnemyPath.GetPoint(path, distance);

		entityData.transform.position = pos.Position;
		entityData.transform.angle = pos.Heading;
	}

	public onTakeDamage(entityData: EnemyEntityData, src:EntityData, damage:number, state:GameState) {
		entityData.health -= damage;
	}

	public static CreatePath(state: GameState, points: V2[]): number {
		const path = EnemyPath.GetPath(points);
		const idx = Game.NextEntityId(state);
		state.enemyPathData[idx] = path;
		console.log(JSON.stringify(path));
		return idx;
	}

	public static CreateEnemy(ship: ShipEquipment, path: number, state: GameState) {
		const shipData = GetShipData(ship.GetShipType());

		const entityData: EnemyEntityData = {
			id: Game.NextEntityId(state),
			transform: {
				position: { x: 0, y: 0 },
				angle: 3 * Math.PI / 2,
				scale: 1,
			},
			shipData: ship,
			health: shipData.baseHealth!,
			maxHealth: shipData.baseHealth!,
			collider: (shipData.collider as CircBody),
			path: path,
			time: 0
		};

		state.enemies[entityData.id] = entityData;
	}
}