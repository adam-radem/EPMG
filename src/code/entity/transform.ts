import { V2 } from "../math/vector";

export interface TransformData {
	position: V2;
	angle: number;
	scale: number;
}

export interface Body {
	center: V2;
}

export interface RectBody extends Body {
	extents: V2;
}

export interface CircBody extends Body {
	radius: number;
}