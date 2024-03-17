import { Player } from "rune-games-sdk";
import { UIElement } from "./UIElement";

export class HeaderElement extends UIElement<Player> {
	private playerId: string | null = null;

	public get PlayerID(): string | null {
		return this.playerId;
	}

	public updateScore(score: number): void {
		const childElements = this.element?.children;
		if (!childElements)
			return;
		const len = childElements.length;
		for (let i = 0; i < len; ++i) {
			const child = childElements[i];
			if (child) {
				if(child.classList.contains('score')){
					child.innerHTML = score.toLocaleString();
				}
			}
		}
	}

	public setData(data: Player): void {
		if (this.playerId === data.playerId)
			return;

		this.playerId = data.playerId;
		
		const childElements = this.element?.children;
		if (!childElements)
			return;
		const len = childElements.length;
		for (let i = 0; i < len; ++i) {
			const child = childElements[i];
			if (child) {
				if (child.classList.contains('name')) {
					child.innerHTML = data.displayName;
				}
				if (child.classList.contains('icon')) {
					(child.children[0] as HTMLImageElement).src = data.avatarUrl;
				}
			}
		}
	}
}