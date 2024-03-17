import * as Game from "../game/game";
import { CircBody } from "./transform";
import { EntitySystem, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { ShipEquipment } from "../types/shipdata";
import { GameState } from "../game/game";
import { GetShipData } from "../databases/shipdatabase";

export interface Path {
	Path: V2[];
	Distance: number[];
	TotalDistance: number;
}

interface PathPoint {
	Position: V2,
	Heading: number;
}

export class EnemyPath {

	public static GetPath(points: V2[]) {
		if (points.length == 1) {
			return { Path: points, Distance: [0], TotalDistance: 0 };
		}

		let totalDistance = 0;
		let distance: number[] = [0];

		for (let i = 1; i < points.length; ++i) {

			const prev = points[i - 1];
			const curr = points[i];

			const diff = Math.sqrt(Vector2.asVector2(curr).subtract(Vector2.asVector2(prev)).sqrMagnitude());

			distance[i] = diff;
			totalDistance += diff;
		}

		return { Path: points, Distance: distance, TotalDistance: totalDistance };
	}

	public static GetPoint(path: Path, distance: number): PathPoint {
		let pos = path.Path[0];
		let heading = 270;

		if (path.Path.length == 1 || distance === 0) {
			return { Position: pos, Heading: heading };
		}

		let dist = distance;
		let last: V2 = path.Path[0];
		for (let i = 0; i < path.Distance.length; ++i) {
			if (dist - path.Distance[i] < 0) {
				const next = path.Path[i];
				//we haven't yet arrived at this point yet
				const ratio = dist / path.Distance[i];
				pos = Vector2.lerp(last, next, ratio);
				const theta = Vector2.angle(last, next);
				heading = Math.floor(theta * (180 / Math.PI) - 270);
				break;
			}
			last = path.Path[i];
		}

		return { Position: pos, Heading: heading };
	}
}

export interface EnemyEntityData extends ShipEntity {
	collider: CircBody;
	path: number;
	time: number,
}

export class EnemySystem extends EntitySystem<EnemyEntityData> {
	public onUpdate(entityData: EnemyEntityData, state: GameState, dt: number): void {
		entityData.time += dt;

		const shipData = GetShipData(entityData.shipData.GetShipType());
		const speed = shipData.speed ?? 10;
		let distance = speed * entityData.time / 1000;

		const path = state.enemyPathData[entityData.path];

		if (distance >= path.TotalDistance)
			distance -= path.TotalDistance;

		const pos = EnemyPath.GetPoint(path, distance);

		entityData.transform.position = pos.Position;
		entityData.transform.angle = pos.Heading;
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
			maxHealth: 0,
			collider: (shipData.collider as CircBody),
			path: path,
			time: 0
		};

		state.enemies[entityData.id] = entityData;
	}
}