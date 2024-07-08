import * as Pixi from "pixi.js";
import { DropEntityData } from "../entity/drop";
import { GameState } from "../game/game";
import { RenderEntity } from "./renderEntity";
import { Scene, SpriteData } from "./renderer";
import { GetDrop } from "../databases/dropdatabase";

export class DropObject implements RenderEntity<DropEntityData> {
	container: Pixi.Container;
	sprite: Pixi.Sprite | undefined;

	public constructor(id: EntityId, data: DropEntityData) {
		this.container = new Pixi.Container();
		Scene.addChild(this.container);
		const drop = GetDrop(data.dropType);

		if (drop && drop.sprite) {
			this.container.x = data.transform.position.x;
			this.container.y = data.transform.position.y;

			this.sprite = SpriteData.GetSprite(drop.sprite);
			this.sprite.zIndex = 0;
			this.sprite.anchor.set(0.5, 0.5);
			this.sprite.angle = 0;
			this.sprite.scale = 2;
			
			if (drop.scoreValue! > 0)
				this.sprite.localColor = 0xAF69EE;
			else if (drop.healthRestore! > 0)
				this.sprite.localColor = 0x03AC13;
			else if (drop.cooldownValue! > 0)
				this.sprite.localColor = 0x57A0D2;

			this.container.addChild(this.sprite);
		}
	}
	onUpdate(data: DropEntityData, state: GameState): void {
		if (this.sprite)
			this.sprite.angle = data.transform.angle * 180 / Math.PI - 270;
		this.container.x = data.transform.position.x;
		this.container.y = data.transform.position.y;
	}
	onDestroy?(): void {
		this.container.destroy();
	}

}