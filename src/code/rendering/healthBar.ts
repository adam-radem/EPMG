import * as Pixi from "pixi.js";

const Height = 60;
const Width = 8;

export class HealthBar {
	private container: Pixi.Container;
	private bg: Pixi.Graphics;
	private healthBar: Pixi.Graphics;
	private interval: number | undefined;

	public constructor() {
		this.container = new Pixi.Container();
		this.container.pivot.set(0.5, 0);

		this.bg = new Pixi.Graphics();
		this.bg.pivot.set(0.5, 0);
		this.bg.rect(-72, 2, 8, (Height + 2))
			.fill({ color: 0x000000, alpha: 0 })
			.stroke({ color: 0xFFFFFF, alpha: 1, width: 2 });
		this.bg.zIndex = -1;
		this.container.addChild(this.bg);

		this.healthBar = new Pixi.Graphics();
		this.healthBar.pivot.set(0.5, 0);
		this.container.addChild(this.healthBar);

		this.container.alpha = 0;
	}

	public get Container() {
		return this.container;
	}

	public setHealthValue(ratio: number) {
		if (this.healthBar) {
			const height = Math.min(Math.max(ratio, 0), 1) * Height;
			this.healthBar.clear();

			//Green stays 255 from 1 -> 0.5 and then lerps to 0 from 0.5 -> 0
			const greenValue = Math.min(Math.max(Math.floor((ratio * 2) * 255), 0), 255);
			//Red lerps from 0 to 255 from 1 -> 0.5 then stays 255
			const redValue = Math.min(Math.max(Math.floor((1 - ((ratio - 0.5) * 2)) * 255), 0), 255);
			const color = (redValue << 16) + (greenValue << 8);

			this.healthBar.rect(-71, Height - height + 2, 6, height)
				.fill({ color: color, alpha: 1 });
		}

		if (ratio >= 1 || ratio <= 0) {
			if (this.interval) {
				window.clearInterval(this.interval);
			}
			this.interval = window.setInterval(this.fade.bind(this), 160);
		} else {
			this.container.alpha = 1;
		}
	}

	private fade() {
		if (this.container.alpha > 0)
			this.container.alpha -= 1 / 60;
	}
}
