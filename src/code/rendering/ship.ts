import { Scene } from "./renderer.ts";
import * as Pixi from "pixi.js";

export class Ship {
	shipContainer: Pixi.Container;

	public constructor() {
		this.shipContainer = new Pixi.Container();
		Scene.addChild(this.shipContainer);
	}

	sprite: Pixi.Sprite | undefined;

	public setSprite(spriteID: string) {

	}

	public setPosition(x: number, y: number) {
		this.shipContainer.x = x;
		this.shipContainer.y = y;
	}
}