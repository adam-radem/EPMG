import { V2 } from "../math/vector";

export type GameActions = {
	setShip: (params: { id: number; }) => void;
	setTarget: (params: { newTarget: V2; }) => void;
	activateAbility: (params: { abilityId: number }) => void;
	endScene: (params: {}) => void;
};