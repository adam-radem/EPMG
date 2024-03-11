import * as Pixi from "pixi.js";
import { Screen } from "./screen.ts";
import * as AtlasData from "../../assets/space/assets.json";
import AtlasImage from "../../assets/space/assets.png";

const WorldSize = Screen.WorldSize;
const gameDiv = document.getElementById('game') ?? null;
const pixiOptions = { background: '#000000', width: WorldSize.x, height: WorldSize.y };

export const App = new Pixi.Application(pixiOptions);
export const Scene = new Pixi.Container();
export const Renderer = App.renderer;

window.onload = resize;
window.onresize = resize;
function resize() {
	if (gameDiv) {
		Renderer.resize(gameDiv.clientWidth, gameDiv.clientHeight);
		fit(true, App.stage, gameDiv.clientWidth, gameDiv.clientHeight, WorldSize.x, WorldSize.y);
	}
}


function fit(center: boolean, stage: Pixi.Container, screenWidth: number, screenHeight: number, virtualWidth: number, virtualHeight: number) {
	stage.scale.x = screenWidth / virtualWidth;
	stage.scale.y = screenHeight / virtualHeight;

	if (stage.scale.x < stage.scale.y) {
		stage.scale.y = stage.scale.x;
	} else {
		stage.scale.x = stage.scale.y;
	}

	const virtualWidthInScreenPixels = virtualWidth * stage.scale.x;
	const virtualHeightInScreenPixels = virtualHeight * stage.scale.y;
	const centerXInScreenPixels = screenWidth * 0.5;
	const centerYInScreenPixels = screenHeight * 0.5;

	if (center) {
		stage.position.x = centerXInScreenPixels;
		stage.position.y = centerYInScreenPixels;
	} else {
		stage.position.x = centerXInScreenPixels - virtualWidthInScreenPixels * 0.5;
		stage.position.y = centerYInScreenPixels - virtualHeightInScreenPixels * 0.5;
	}
}

export async function Init() {
	App.renderer.background.color = `hsl(${Math.random() * 360}deg 30% 10%)`;
	App.stage.addChild(Scene);

	try {
		const spriteSheet = new Pixi.Spritesheet(
			Pixi.Texture.from(AtlasImage),
			AtlasData
		);
		await spriteSheet.parse();

	}
	catch (err) {
		console.log(err);
	}

	gameDiv?.appendChild((App.view as any));
}