import * as Pixi from "pixi.js";
import { Screen } from "./screen.ts";
import { Sprites } from "./sprites.ts";
import { GameState } from "../game/game.ts";
import { GlobalGameParameters } from "../game/static.ts";


const WorldSize = Screen.WorldSize;
const gameDiv = document.getElementById('game') ?? null;
const pixiOptions = {
	background: '#000011',
	width: WorldSize.x,
	height: WorldSize.y,
	premultipliedAlpha: false,
	transparent: false,
	antialias: true,
	eventFeatures: {
		move: false,
		globalMove: false,
		click: true,
		wheel: false
	}
};

export const App = new Pixi.Application(pixiOptions);
export const Scene = new Pixi.Container();
export const Background = new Pixi.Graphics();
export const Renderer = App.renderer;
export const SpriteData = await new Sprites();

if (GlobalGameParameters.Debug) {
	const footer = document.getElementById('ui-footer');
	const FPS = document.createElement('div');
	FPS.id = "FPS";
	FPS.innerHTML = "00.0 fps";
	footer?.appendChild(FPS);
	if (FPS) {
		let time = 0, frame = 0;
		App.ticker.add((dt) => {
			time += App.ticker.elapsedMS;
			++frame;
			if (time > 1000) {
				const avgFT = 1000 / frame;
				const avgFPS = 1000 / avgFT;
				FPS.innerHTML = avgFPS.toFixed(1) + " fps";
				time -= 1000;
				frame = 0;
			}
		});
	}

	const version = document.createElement('div');
	version.id = 'version';
	version.innerHTML = GlobalGameParameters.Version;
	footer?.appendChild(version);
}

export async function Init() {
	const playable = Screen.PlayableArea;

	Scene.width = playable.x;
	Scene.height = playable.y;
	Scene.x = (WorldSize.x - playable.x) / 2;
	Scene.y = (WorldSize.y - playable.y) / 2;

	App.stage.addChild(Scene);

	const mask = new Pixi.Graphics();
	mask.beginFill(0x000000, 0.2);
	mask.drawRoundedRect(0, 0, playable.x, playable.y, 12);
	mask.endFill();
	mask.zIndex = -1000;

	Scene.mask = mask;
	Scene.addChild(mask);

	Background.beginFill(0x000011, 1);
	Background.blendMode = Pixi.BLEND_MODES.ADD;
	Background.drawRoundedRect(0, 0, playable.x, playable.y, 12);
	Background.endFill();
	Background.zIndex = -1000;
	Scene.addChild(Background);

	Scene.sortableChildren = true;

	gameDiv?.appendChild((App.view as any));
	await SpriteData.Init();
}

window.onload = resize;
window.onresize = resize;
function resize() {
	if (gameDiv) {
		Renderer.resize(gameDiv.clientWidth, gameDiv.clientHeight);
		fit(false, App.stage, gameDiv.clientWidth, gameDiv.clientHeight, WorldSize.x, WorldSize.y);
	}
}

function fit(center: boolean, stage: Pixi.Container, screenWidth: number, screenHeight: number, virtualWidth: number, virtualHeight: number) {
	const minScale = Math.min((screenWidth / virtualWidth), (screenHeight / virtualHeight));
	stage.scale.set(minScale);

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

export function updateLevelParameters(state: GameState) {
	const playable = Screen.PlayableArea;

	const col = `hsl(${(state.level.seed / 65535) * 360}deg 30% 10%)`;
	Background.clear();
	Background.beginFill(col, 1);
	Background.drawRoundedRect(0, 0, playable.x, playable.y, 12);
	Background.endFill();
}