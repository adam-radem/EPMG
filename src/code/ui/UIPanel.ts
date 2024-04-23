import { GameState } from "../game/game";

export interface UIPanel {
	Dismiss?(): void;
	Present?(): void;
	Update?(state:GameState) : void;
}