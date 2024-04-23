import * as Pixi from "pixi.js";
import { Screen } from "./screen.ts";
import { Sprites } from "./sprites.ts";
import { GameState, Phase } from "../game/game.ts";
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
	resizeTo: gameDiv!,
	eventFeatures: {
		move: false,
		globalMove: false,
		click: true,
		wheel: false
	}
};

export const App = new Pixi.Application();
export const Scene = new Pixi.Container();
export const Background = new Pixi.Graphics();
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
	await App.init(pixiOptions);

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
	mask.roundRect(0, 0, playable.x, playable.y, 12)
		.fill({ color: 0x000000, alpha: 0.2 });
	mask.zIndex = -1000;

	Scene.mask = mask;
	Scene.addChild(mask);

	Background.blendMode = 'add';
	Background.roundRect(0, 0, playable.x, playable.y, 12).fill(0x000011FF);
	Background.zIndex = -1000;
	Scene.addChild(Background);

	starfield = new Starfield(100);
	Scene.addChild(starfield.container);

	Scene.sortableChildren = true;

	gameDiv?.appendChild((App.canvas as any));
	await SpriteData.Init();

	resize();
}

function tick(ticker: Pixi.Ticker) {
	if (starfield)
		starfield.onUpdate(ticker.deltaTime);
}

window.onload = resize;
window.onresize = resize;
function resize() {
	if (gameDiv && App.renderer) {
		App.renderer.resize(gameDiv.clientWidth, gameDiv.clientHeight);
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

let targetSat: number = 0;
export function updateLevelParameters(state: GameState) {
	if (GlobalGameParameters.Debug && !debug) {
		debug = new Pixi.Graphics();
		for (const pid in state.enemyPathData) {
			const path = state.enemyPathData[pid];
			for (let i = 0; i < path.Path.length; ++i) {
				debug.circle(path.Path[i].x, path.Path[i].y, 10)
					.fill(0xFFFFFFFF)
					.stroke({ color: 0xFFFFFF, alpha: 0.6, width: 2 });
				if (i + 1 < path.Path.length) {
					debug.moveTo(path.Path[i].x, path.Path[i].y)
						.lineTo(path.Path[i + 1].x, path.Path[i + 1].y)
						.stroke({ color: 0xFFFFFF, alpha: 0.5, width: 4 });
				}
			}
		}

		Scene.addChild(debug);
	}

	const playable = Screen.PlayableArea;

	const targetHue = (state.level.seed / 65535) * 360;
	if (state.level.phase !== Phase.Level) {
		if (targetSat > 0) {
			targetSat -= 2;
		}
	} else {
		if (targetSat < 30) {
			targetSat += 2;
		}
	}

	const targetVal = 20 - (targetSat / 3);

	const col = `hsl(${targetHue}deg ${targetSat}% ${targetVal}%)`;
	Background.clear();
	Background.roundRect(0, 0, playable.x, playable.y, 12)
		.fill(col);
}