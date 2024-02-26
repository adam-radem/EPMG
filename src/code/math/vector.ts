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

	public clone(): Vector2 {
		return new Vector2(this.x, this.y);
	}

	public sqrMagnitude(): number {
		return (this.x * this.x) + (this.y * this.y);
	}
	public magnitude(): number {
		return Math.sqrt(this.sqrMagnitude());
	}

	public normalize() {
		this.divideScalar(this.magnitude());
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
}