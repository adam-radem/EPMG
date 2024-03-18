import * as Pixi from "pixi.js";

const Height = 60;
const Width = 8;

export class HealthBar {
	private bg: Pixi.Graphics;
	private healthBar: Pixi.Graphics;
	private interval: number | undefined;

	public constructor() {
		this.bg = new Pixi.Graphics();
		this.bg.beginFill(0x000000, 1);
		this.bg.lineStyle(2, 0xFFFFFF, 1);
		this.bg.drawRect(-71, -(Height+1), 8, (Height+2));
		this.bg.endFill();
		this.bg.alpha = 0;
		this.bg.zIndex = 1;

		this.healthBar = new Pixi.Graphics();
		this.bg.addChild(this.healthBar);
	}

	public get Container() {
		return this.bg;
	}

	public setHealthValue(ratio: number) {
		if (ratio < 1 && this.interval) {
			window.clearInterval(this.interval);
			this.interval = undefined;
		}

		if (this.healthBar) {
			const height = Math.min(Math.max(ratio, 0), 1) * Height;
			this.healthBar.clear();

			this.healthBar.beginFill(0x00FF00, 1);
			this.healthBar.drawRect(-70, -height, 6, height);
			this.healthBar.endFill();
		}

		if (ratio >= 1) {
			window.setInterval(this.fade.bind(this), 160);
		} else {
			this.bg.alpha = 1;
		}
	}

	private fade() {
		if (this.bg.alpha > 0)
			this.bg.alpha -= 1 / 60;
	}
}
