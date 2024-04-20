import { Player } from "rune-games-sdk";
import { UIElement } from "./UIElement";

export class HeaderElement extends UIElement<Player> {
	private playerId: string | null = null;

	public get PlayerID(): string | null {
		return this.playerId;
	}

	public Reset() {
		this.playerId = null;
	}

	public updateScore(score: number): void {
		const childElements = this.element?.children;
		if (!childElements)
			return;
		const len = childElements.length;
		for (let i = 0; i < len; ++i) {
			const child = childElements[i];
			if (child) {
				if (child.classList.contains('score')) {
					const prev = parseInt(child.getAttribute('displayedScore') || '0');
					if (score != prev) {
						const diff = (score - prev);
						if (diff > 5) {
							const v = Math.floor(Math.random() * (diff / 4) + 2);
							const disp = Math.min(prev + v, score);
							child.setAttribute('displayedScore', disp.toString());
							child.innerHTML = disp.toLocaleString();
						}
						else {
							child.setAttribute('displayedScore', score.toString());
							child.innerHTML = score.toLocaleString();
						}
					}
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
					const childElement = child as HTMLDivElement;

					childElement.style.background = `url('${data.avatarUrl}')`;
					childElement.style.backgroundPosition = 'center';
					childElement.style.backgroundSize = 'cover';

					childElement.style.opacity = '30%';
				}
			}
		}
	}
}