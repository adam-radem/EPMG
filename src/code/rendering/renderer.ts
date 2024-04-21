import * as Pixi from "pixi.js";
import { Screen } from "./screen.ts";
import { Sprites } from "./sprites.ts";
import { GameState } from "../game/game.ts";
import { GlobalGameParameters } from "../game/static.ts";
import { Starfield } from "./starfield.ts";

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

let starfield: Starfield;

let debug: Pixi.Graphics | undefined = undefined;

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
	App.ticker.maxFPS = 60;
	App.ticker.minFPS = 15;
	App.ticker.add(tick);

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

	starfield = new Starfield(100);
	Scene.addChild(starfield.container);

	Scene.sortableChildren = true;

	gameDiv?.appendChild((App.view as any));
	await SpriteData.Init();

	resize();
}

function tick(dt: number) {
	if (starfield)
		starfield.onUpdate(dt);
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

let currFill: number = -1;
let fillVal: number = 0;
export function updateLevelParameters(state: GameState) {
	if (GlobalGameParameters.Debug && !debug) {
		debug = new Pixi.Graphics();
		debug.beginFill('0xFFFFFF', 1);
		debug.lineStyle(2, 0xFFFFFF, 0.6);
		for (const pid in state.enemyPathData) {
			const path = state.enemyPathData[pid];
			for (let i = 0; i < path.Path.length; ++i) {
				debug.drawCircle(path.Path[i].x, path.Path[i].y, 10);
				if (i + 1 < path.Path.length) {
					debug.lineStyle(4, 0xFFFFFF, 0.5)
						.moveTo(path.Path[i].x, path.Path[i].y)
						.lineTo(path.Path[i + 1].x, path.Path[i + 1].y);
				}
			}
		}
		debug.endFill();

		Scene.addChild(debug);
	}


	const playable = Screen.PlayableArea;

	const newFill = (state.level.seed / 65535) * 360;
	if (currFill >= 0) {
		fillVal = (newFill - currFill) / 5;
		if (Math.abs(fillVal) < 1)
			return;

		currFill += fillVal;
	}
	else {
		currFill = newFill;
	}
	const col = `hsl(${currFill}deg 30% 10%)`;
	Background.clear();
	Background.beginFill(col, 1);
	Background.drawRoundedRect(0, 0, playable.x, playable.y, 12);
	Background.endFill();
}