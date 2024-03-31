import * as Pixi from "pixi.js";
import { ProjectileData } from "../entity/projectile.ts";
import { RenderEntity } from "./renderEntity.ts";
import { Scene, SpriteData } from "./renderer.ts";
import { GetProjectile } from "../databases/projectiledatabase.ts";

export class ProjectileObject implements RenderEntity<ProjectileData> {
	container: Pixi.Container;
	sprite: Pixi.Sprite | undefined;

	public constructor(id: EntityId, data: ProjectileData) {
		this.container = new Pixi.Container();
		Scene.addChild(this.container);

		const projectile = GetProjectile(data.type);
		if (projectile && projectile.sprite) {
			this.sprite = SpriteData.GetSprite(projectile.sprite);
			this.sprite.zIndex = 0;
			this.sprite.anchor.set(0.5, 1);
			this.sprite.angle = data.transform.angle * 180 / Math.PI - 270;

			this.container.addChild(this.sprite);
		}
	}

	onUpdate(data: ProjectileData): void {
		if(this.sprite)
			this.sprite.angle = data.transform.angle * 180 / Math.PI - 270;
		this.container.x = data.transform.position.x;
		this.container.y = data.transform.position.y;
	}
	onCreate?(): void {
		// throw new Error("Method not implemented.");
	}
	onDestroy?(): void {
		this.container.destroy();
	}
}
