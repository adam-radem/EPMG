import { PlayerId } from "rune-games-sdk";
import { GetShipData } from "../databases/shipdatabase";
import { GameState } from "../game/game";
import { GlobalGameParameters } from "../game/static";
import { App, SpriteData } from "../rendering/renderer";
import { ShipData, Ships } from "../types/shipdata";
import { PanelType } from "./UIController";
import { UIPanel } from "./UIPanel";
import { GetEquipmentData } from "../databases/equipdatabase";


export class BriefingPanel implements UIPanel {
	element: HTMLDivElement;
	briefingStatus: HTMLDivElement;
	briefingReady: HTMLDivElement;

	public constructor() {
		this.element = document.getElementById('ui-briefing') as HTMLDivElement;
		this.briefingStatus = document.getElementById('briefing-timeout') as HTMLDivElement;
		this.briefingReady = document.getElementById('briefing-countdown') as HTMLDivElement;
	}

	public Type(): PanelType {
		return PanelType.Briefing;
	}

	public setupShips(state: GameState, localPlayer: PlayerId) {
		const idx = state.players[localPlayer]?.idx || 0;

		const ids = ['ship_one', 'ship_two', 'ship_three'];
		for (let i = 0; i < ids.length; ++i) {
			const data = GetShipData(Ships.Players[i] + idx) as ShipData;
			const sprite = data.sprite;
			if (sprite) {
				this.setShipSprite(ids[i], data, sprite);
			}
		}
	}

	public setShipSprite(id: string, data: ShipData, sprite: string) {
		const children = document.getElementById(id)?.children;
		if (children) {
			for (let i = 0; i != children.length; ++i) {
				const child = children[i] as HTMLDivElement;
				if (child.classList.contains('shop-icon')) {
					const spr = SpriteData.GetSprite(sprite);
					const canvas = App.renderer.extract.canvas(spr);
					if (canvas && canvas.toDataURL) {
						const imgSrc = canvas.toDataURL('image/png');
						if (imgSrc) {
							child.style.background = `center / 50% no-repeat url('${imgSrc}')`;
						}
					}
				}
				else if (child.classList.contains('ship-stats')) {
					this.setupStats(child, data);
				}
			}
		}
	}

	private setupStats(element: HTMLDivElement, data: ShipData) {
		const children = element.children;
		if (children) {
			for (let i = 0; i != children.length; ++i) {
				const child = children[i] as HTMLDivElement;
				if (child.classList.contains('ship-speed')) {
					//0% => 300, 100% => 600
					const speedValue = 100 * ((data.speed - 300) / 300);
					child.style.setProperty('--ship-stat-value', `${speedValue}%`);
				}
				else if (child.classList.contains('ship-damage')) {
					const weapon = GetEquipmentData(data.defaultWeapon).weapon;
					const damageValue = 100 * (weapon?.projectile?.damage || 0) / 50;
					child.style.setProperty('--ship-stat-value', `${damageValue}%`);
				}
				else if (child.classList.contains('ship-health')) {
					const healthValue = 100 * ((data.baseHealth) - 500) / 600;
					child.style.setProperty('--ship-stat-value', `${healthValue}%`);
				}
			}
		}
	}

	public Update(state: GameState, localPlayer: PlayerId): void {
		const stateReady = state.level.ready;
		if (stateReady && state.level.progress > 0) {
			this.briefingReady.parentElement!.classList.remove('hidden');
			this.briefingStatus.parentElement!.classList.add('hidden');
			let timeout = (2000 - state.level.progress) / 1000;
			this.briefingReady.innerHTML = (timeout + 1).toFixed(0);
			return;
		}

		let timeout = (GlobalGameParameters.MaxShoppingTime - (Rune.gameTime() - state.level.startTime)) / 1000;
		this.briefingStatus.innerHTML = timeout.toFixed(1);
	}

	public Present(state: GameState, localPlayer: PlayerId) {
		this.setupShips(state, localPlayer);
		this.element.classList.remove('hidden');

		if (state.level.ready) {
			this.HideShipSelection();
		}
		else {
			this.ShowShipSelection();
		}
	}

	public ShowShipSelection() {
		document.getElementById('briefing-selection')?.classList.remove('hidden');
	}

	public HideShipSelection() {
		document.getElementById('briefing-selection')?.classList.add('hidden');
	}

	public Dismiss(state: GameState, localPlayer: PlayerId) {
		this.element.classList.add('hidden');
		this.briefingReady.parentElement!.classList.add('hidden');
	}
}
