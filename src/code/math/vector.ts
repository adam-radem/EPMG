/* eslint-disable no-restricted-syntax */

export interface V2 {
	x: number;
	y: number;
}

export module Vector2 {

	export function makeVector(x: number, y: number): V2 {
		return { x: x, y: y };
	}

	export function clone(other: Readonly<V2>): V2 {
		return { x: other.x, y: other.y };
	}

	export function zero(): V2 {
		return { x: 0, y: 0 };
	}

	export function one(): V2 {
		return { x: 1, y: 1 };
	}

	export function isZero(vector: Readonly<V2>): boolean {
		return vector.x === 0 && vector.y === 0;
	}

	export function equals(a: Readonly<V2>, b: Readonly<V2>): boolean {
		return a.x === b.x && a.y === b.y;
	}

	export function sqrMagnitude(vector: Readonly<V2>): number {
		return (vector.x * vector.x) + (vector.y * vector.y);
	}
	export function magnitude(vector: Readonly<V2>): number {
		return Math.sqrt(Vector2.sqrMagnitude(vector));
	}

	export function normalize(vector: Readonly<V2>): V2 {
		return Vector2.divideScalar(vector, Vector2.magnitude(vector));
	}

	export function clamp(vector: Readonly<V2>, minX: number, maxX: number, minY: number, maxY: number): V2 {
		const x = Math.min(Math.max(vector.x, minX), maxX);
		const y = Math.min(Math.max(vector.y, minY), maxY);
		return Vector2.makeVector(x, y);
	}

	export function addVector(a: Readonly<V2>, b: Readonly<V2>): V2 {
		return Vector2.makeVector(a.x + b.x, a.y + b.y);
	}

	export function subtract(a: Readonly<V2>, b: Readonly<V2>): V2 {
		return Vector2.makeVector(a.x - b.x, a.y - b.y);
	}

	export function multiplyScalar(vector: Readonly<V2>, scalar: number): V2 {
		return Vector2.makeVector(vector.x * scalar, vector.y * scalar);
	}

	export function divideScalar(vector: Readonly<V2>, scalar: number): V2 {
		return Vector2.makeVector(vector.x / scalar, vector.y / scalar);
	}

	export function vectorAngle(vector: Readonly<V2>): number {
		return Math.atan2(vector.y, vector.x);
	}

	export function dot(a: Readonly<V2>, b: Readonly<V2>): number {
		return a.x * b.x + a.y * b.y;
	}

	export function lerp(a: Readonly<V2>, b: Readonly<V2>, t: number): V2 {
		const x = a.x * (1 - t) + b.x * t;
		const y = a.y * (1 - t) + b.y * t;
		return Vector2.makeVector(x, y);
	}

	export function angleBetween(a: Readonly<V2>, b: Readonly<V2>): number {
		const diffVector = Vector2.subtract(a, b);
		return Vector2.vectorAngle(diffVector);
	}
}