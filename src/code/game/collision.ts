import { Body, CircBody, Collider, RectBody, TransformData } from "../entity/transform";
import { V2, Vector2 } from "../math/vector";
import { GameState, Systems, TeamId } from "./game";

type TransformedCollider = Collider & TransformData;

function CircContains(circ: CircBody, pt: V2) {
	const dist = (circ.radius * circ.radius);
	return Vector2.asVector2(circ.center).subtract(pt).sqrMagnitude() <= dist;
}

function CircOverlap(circ1: CircBody, circ2: CircBody) {
	const dist = (circ1.radius + circ2.radius) * (circ1.radius + circ2.radius);
	return Vector2.asVector2(circ1.center).subtract(circ2.center).sqrMagnitude() <= dist;
}

function RotatePoint(pt: V2, angle: number): Vector2 {
	const rads = angle * Math.PI / 180;
	const s = Math.sin(-rads);
	const c = Math.cos(-rads);
	return new Vector2(pt.x * c - pt.y * s, pt.x * s + pt.y * c);
}

function RectOverlap(rect1: RectBody, rect2: RectBody) {
	//Check if either center is inside
	if (RectContains(rect1, rect2.center) || RectContains(rect2, rect1.center))
		return true;

	//Check if any corners overlap
	const topRight = Vector2.asVector2(rect2.center).add(rect2.extents);
	if (RectContains(rect1, RotatePoint(topRight, rect2.angle)))
		return true;

	const topLeft = topRight.clone().subtract({ x: rect2.extents.x * 2, y: 0 });
	if (RectContains(rect1, RotatePoint(topLeft, rect2.angle)))
		return true;

	const bottomLeft = topLeft.clone().subtract({ x: 0, y: rect2.extents.y * 2 });
	if (RectContains(rect1, RotatePoint(bottomLeft, rect2.angle)))
		return true;

	const bottomRight = topRight.clone().subtract({ x: 0, y: rect2.extents.y * 2 });
	if (RectContains(rect1, RotatePoint(bottomRight, rect2.angle)))
		return true;

	//If the center is not fully contained and no corners overlap then the rects are not touching
	return false;
}

function RectContains(rect: RectBody, pt: V2) {
	//Vector relative to rectangle center
	var newPoint = Vector2.asVector2(pt).subtract(rect.center);
	//Rotate vector to match rectangle
	newPoint = RotatePoint(newPoint, rect.angle);
	//Recenter origin
	newPoint.add(rect.center);

	//Calculate min/max thresholds of the rectangle
	const xMin = rect.center.x - rect.extents.x;
	const xMax = rect.center.x + rect.extents.x;
	const yMin = rect.center.y - rect.center.y;
	const yMax = rect.center.y + rect.center.y;

	//Check if the point is within the rectangle boundaries
	return newPoint.x >= xMin && newPoint.x <= xMax && newPoint.y >= yMin && newPoint.y <= yMax;
}

function CircRectOverlap(circ: CircBody, rect: RectBody) {

	//Calculate the horizontal distance 
	const xDist = Math.abs(circ.center.x - rect.center.x);

	//If they are too far apart they cannot overlap
	if (xDist > (circ.radius + rect.extents.x))
		return false;

	//Calculate the vertical distance
	const yDist = Math.abs(circ.center.y - rect.center.y);
	//If they are too far apart, they cannot overlap
	if (yDist > (circ.radius + rect.extents.y))
		return false;

	//If the distance is less than the rectangle extents they are overlapping
	if (xDist <= rect.extents.x && yDist <= rect.extents.y)
		return true;

	//Check if corners are within the circle radius
	var dx = xDist - rect.extents.x;
	var dy = yDist - rect.extents.y;
	return (dx * dx + dy * dy <= (circ.radius * circ.radius));
}

function isCirc(object: any): object is CircBody {
	return 'radius' in object;
}

function isRect(object: any): object is RectBody {
	return 'extents' in object;
}

function colliderActive(collider:Body, state:GameState){
	return (!collider.disabledUntil || collider.disabledUntil <= state.time);
}

export class CollisionSystem {
	public onUpdate(state: GameState) {
		//First check for player <-> enemy collisions
		const players: Record<string, TransformedCollider> = {};
		const enemies: Record<string, TransformedCollider> = {};

		//Cache player collider data
		for (const pid in state.players) {
			const playerData = state.players[pid];
			if(colliderActive(playerData.collider, state)){
				const col = this.TransformCollider(playerData.transform, playerData.collider);
				players[pid] = col;
			}
		}

		//Cache enemy collider data
		for (const eid in state.enemies) {
			const enemyData = state.enemies[eid];
			if(colliderActive(enemyData.collider, state)){
				const col = this.TransformCollider(enemyData.transform, enemyData.collider);
				enemies[eid] = col;
			}
		}

		//Check for player <-> enemy collisions
		for (const pid in players) {
			for (const eid in enemies) {
				if (this.Overlap(players[pid], enemies[eid])) {
					Systems.player.onCollide?.(state.players[pid], state.enemies[eid], state);
					Systems.enemy.onCollide?.(state.enemies[eid], state.players[pid], state);
					break;
				}
			}
		}

		for (const proj in state.projectiles) {
			const projectile = state.projectiles[proj];
			const col = this.TransformCollider(projectile.transform, projectile.collider);
			if (projectile.team === TeamId.Player) {
				// Check for enemy collisions
				for (const eid in enemies) {
					if (this.Overlap(col, enemies[eid])) {
						Systems.projectile.onCollide?.(projectile, state.enemies[eid], state);
						Systems.enemy.onCollide?.(state.enemies[eid], projectile, state);
						break;
					}
				}
			}
			else {
				//Check for player collisions
				for (const pid in players) {
					if (this.Overlap(col, players[pid])) {
						Systems.projectile.onCollide?.(projectile, state.players[pid], state);
						Systems.player.onCollide?.(state.players[pid], projectile, state);
						break;
					}
				}
			}
		}
	}

	private TransformCollider(transform: TransformData, collider: Collider): TransformedCollider {
		const obj: any = {};
		Object.assign(obj, collider, transform);
		const pos = Vector2.asVector2(transform.position).add(collider.center);
		obj.center = pos;
		return obj as TransformedCollider;
	}

	private Overlap(a: TransformedCollider, b: TransformedCollider): boolean {
		if (isCirc(a)) {
			if (isCirc(b)) {
				//a circ, b circ
				return CircOverlap(a, b);
			}
			if (isRect(b)) {
				//a circ, b rect
				return CircRectOverlap(a, b);
			}
			//a circ, b point
			return CircContains(a, b.position);
		}
		else if (isRect(a)) {
			//a rect, b circ
			if (isCirc(b)) {
				return CircRectOverlap(b, a);
			}
			//a rect, b rect
			if (isRect(b)) {
				return RectOverlap(a, b);
			}
			//a rect, b point
			return RectContains(a, b.position);
		}
		else if (isCirc(b)) {
			//a point, b circ
			return CircContains(b, a.position);
		}
		else if (isRect(b)) {
			//a point, b rect
			return RectContains(b, a.position);
		}
		//a point, b point, invalid colliders, etc.
		return false;
	}
}