import * as Pixi from "pixi.js";
import { V2 } from "../math/vector";
import { Screen } from "./screen";

interface Star {
	speed: number;
	scale: number;
	intensity: number;
	color: string;
	offset: V2;
}

export class Starfield {
	container: Pixi.Graphics;
	stars: Star[];

	public constructor(starCount: number) {
		this.container = new Pixi.Graphics();
		this.container.pivot.set(0, 0);
		this.stars = [];
		for (let i = 0; i != starCount; ++i) {
			this.stars.push(this.CreateStar());
		}
		this.onUpdate(0);
	}

	private CreateStar() {
		const newStar = {
			speed: Math.random() * 0.6 + 0.1,
			scale: Math.random() * 4 + 1,
			intensity: Math.random() * 0.5 + 0.35,
			color: '#' + Math.floor(Math.random() * 128 + 128).toString(16) + Math.floor(Math.random() * 128 + 128).toString(16) + Math.floor(Math.random() * 128 + 128).toString(16),
			offset: {
				x: Math.random() * Screen.WorldSize.x,
				y: Math.random() * Screen.WorldSize.y
			}
		};
		return newStar;
	}

	public onUpdate(dt: number) {
		this.container.clear();

		for (let i = 0; i < this.stars.length; ++i) {
			this.stars[i].offset.y += this.stars[i].speed * dt;

			if (this.stars[i].offset.y > Screen.WorldSize.y) {
				const newStar = this.CreateStar();
				newStar.offset.y = -Math.random() * 50;

				this.stars[i] = newStar;
			}
			this.container.circle(this.stars[i].offset.x, this.stars[i].offset.y, this.stars[i].scale)
				.fill({ color: this.stars[i].color, alpha: this.stars[i].intensity });
		}
	}
}