import { GameState, ScoreData } from "../game/game";
import { App } from "../rendering/renderer";
import { UIElement } from "./UIElement";

export class UIScoreDropElement extends UIElement<ScoreData> {

	public isExpired(state: GameState): boolean {
		if (this.data?.expires)
			return this.data?.expires <= state.time;

		return true;
	}

	public setVisible(visible: boolean): void {
		if (this.isVisible() === visible)
			return;

		super.setVisible(visible);
		if (this.element) {
			this.element.style.animation = visible ? 'ui-score-drop-animation 2s' : '';
		}
	}

	public setElementColor(color: string) {
		if (this.element) {
			this.element.style.color = `#${color}`;
		}
	}

	public setData(score: ScoreData) {
		if (this.element) {
			const scale = App.stage.scale;
			this.element.innerHTML = `+${score.value}`;
			this.element.style.left = `${score.position.x * scale.x}px`;
			this.element.style.top = `${score.position.y * scale.y}px`;
		}
	}
}