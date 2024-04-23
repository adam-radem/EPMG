import {
	V2,
	Vector2
} from "../math/vector";

export type GameActions = {
	setShip: (params: { id: number }) => void;
	setTarget: (params: { newTarget: V2; }) => void;
	endScene: (params: {}) => void;
};