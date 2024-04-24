import * as Pixi from "pixi.js";
import * as AtlasData from "../../assets/space/assets.json";
import AtlasImage from "../../assets/space/assets.png";

export class Sprites {
	Spritesheet: Pixi.Spritesheet | undefined;

	Init() {
		return new Promise((resolve) => {
			Pixi.Assets.load(AtlasImage)
				.then(() => {
					this.Spritesheet = new Pixi.Spritesheet(
						Pixi.Texture.from(AtlasImage),
						AtlasData);
					this.Spritesheet.parse().then(() => resolve(2));
				});
		});
	}

	public GetSprite(spriteID: string): Pixi.Sprite {
		return new Pixi.Sprite(this.Spritesheet!.textures[spriteID]);
	}
}