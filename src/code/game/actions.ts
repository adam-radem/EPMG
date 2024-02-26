import { Vector2
 } from "../math/vector";

export type GameActions = {
	setVelocity: (params: { newVelocity: Vector2; }) => void;
	endScene: (params: {}) => void;
};