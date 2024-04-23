import { PlayerId } from "rune-games-sdk";
import { GameState } from "../game/game";
import { PanelType } from "./UIController";

export interface UIPanel {
	Type(): PanelType;

	Dismiss?(state:GameState, localPlayer:PlayerId): void;
	Present?(state:GameState, localPlayer:PlayerId): void;
	Update?(state: GameState, localPlayer:PlayerId): void;
}