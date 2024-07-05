import { GameState } from "../game/game";
import { UIElement } from "./UIElement";

export class ProgressElement extends UIElement<GameState> {

	enemyCounterDisplay: HTMLDivElement | undefined;

	public setData(data: GameState): void {
		const childElements = this.element?.children;
		if (!childElements)
			return;

		this.data = data;


	}
}