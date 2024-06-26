import { V2 } from "../math/vector";

export interface TransformData {
	position: V2;
	angle: number;
	scale: number;
}

export interface Body {
	center: V2;
	disabledUntil?: number;
}

export interface RectBody extends Body {
	extents: V2;
	angle: number;
}

export interface CircBody extends Body {
	radius: number;
}

export type Collider = CircBody | RectBody | Body;