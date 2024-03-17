import * as Pixi from "pixi.js";
import * as AtlasData from "../../assets/space/assets.json";
import AtlasImage from "../../assets/space/assets.png";

export class Sprites {
	Spritesheet: Pixi.Spritesheet;

	public constructor() {
		this.Spritesheet = new Pixi.Spritesheet(
			Pixi.Texture.from(AtlasImage),
			AtlasData);
	}

	async Init() {
		await this.Spritesheet.parse();
	}

	public GetSprite(spriteID: string): Pixi.Sprite {
		return new Pixi.Sprite(this.Spritesheet.textures[spriteID]);
	}
}