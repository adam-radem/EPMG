export interface V2 {
	x: number;
	y: number;
}

export class Vector2 implements V2 {
	public x: number = 0;
	public y: number = 0;

	public constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	static asVector2(other: V2): Vector2 {
		return new Vector2(other.x, other.y);
	}

	static zero(): Vector2 {
		return new Vector2(0, 0);
	}

	static one(): Vector2 {
		return new Vector2(1, 1);
	}

	public isZero(): boolean {
		return this.x === 0 && this.y === 0;
	}

	public clone(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	public equals(other: V2): boolean {
		return this.x === other.x && this.y === other.y;
	}

	public sqrMagnitude(): number {
		return (this.x * this.x) + (this.y * this.y);
	}
	public magnitude(): number {
		return Math.sqrt(this.sqrMagnitude());
	}

	public normalize(): Vector2 {
		return this.divideScalar(this.magnitude());
	}

	public clamp(minX: number, maxX: number, minY: number, maxY: number): Vector2 {
		this.x = Math.min(Math.max(this.x, minX), maxX);
		this.y = Math.min(Math.max(this.y, minY), maxY);
		return this;
	}

	public add(other: Vector2): Vector2 {
		this.x += other.x;
		this.y += other.y;
		return this;
	}

	public subtract(other: Vector2): Vector2 {
		this.x -= other.x;
		this.y -= other.y;
		return this;
	}

	public multiplyScalar(scalar: number): Vector2 {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	public divideScalar(scalar: number): Vector2 {
		this.x /= scalar;
		this.y /= scalar;
		return this;
	}

	public angle(): number {
		return Math.atan2(this.y, this.x);
	}

	public static dot(a: Vector2, b: Vector2): number {
		return a.x * b.x + a.y * b.y;
	}

	public static lerp(a: V2, b: V2, t: number): Vector2 {
		const x = a.x * (1 - t) + b.x * t;
		const y = a.y * (1 - t) + b.y * t;
		return new Vector2(x,y);
	}

	public static angle(a: V2, b: V2): number {
		const diffVector = Vector2.asVector2(a).subtract(Vector2.asVector2(b));
		return Math.atan2(diffVector.y, diffVector.x);
	}
}