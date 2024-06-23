import * as UI from './code/ui/UIController';
import * as RenderFactory from "./code/rendering/renderFactory";
import { App, Scene } from './code/rendering/renderer';
import { PlayerId, Players } from "rune-games-sdk";
import { GameState, Phase } from "./code/game/game";
import { Keyboard, KeyState } from "./code/input/keyboard";
import { RenderEntity } from "./code/rendering/renderEntity";
import { V2, Vector2 } from './code/math/vector';
import { ShipObject } from './code/rendering/shipobject';
import { PlayerEntityData } from './code/entity/player';
import { BriefingPanel } from './code/ui/BriefingPanel';

export const MaxPlayers = 2;

type EntityList = Record<string, RenderEntity<any>>;

export class GameClient {
	localPlayerId: PlayerId | undefined;

	control: boolean = false;
	interval: number = -1;
	localPlayerPosition: V2 = Vector2.zero();
	directionChanged: boolean = false;
	lastInputDirection: V2 = Vector2.zero();
	renderEntities: EntityList = {};

	public static sendAbility(abilityId: number) {
		Rune.actions.activateAbility({ abilityId: abilityId });
	}

	public registerInput() {
		const onPointerDown = (ev: PointerEvent) => {
			if (!this.localPlayerId) //ignore this from spectators
				return;

			const projected = Scene.toLocal({ x: Math.floor(ev.x), y: Math.floor(ev.y) });
			Rune.actions.setTarget({ newTarget: projected });
			this.lastInputDirection = projected;

			window.addEventListener('pointermove', cbMove);

			this.interval = window.setInterval(dispatch, 200);
		};

		const onPointerMove = (ev: PointerEvent) => {
			if (!this.localPlayerId) //ignore this from spectators
				return;

			const projected = Vector2.clone(Scene.toLocal({ x: Math.floor(ev.x), y: Math.floor(ev.y) }));
			let diff = Vector2.subtract(projected, this.lastInputDirection);
			if (Vector2.sqrMagnitude(diff) > 10) {
				this.directionChanged = true;
				this.lastInputDirection = projected;
			}
		};

		const onPointerCancel = (ev: PointerEvent) => {
			if (!this.localPlayerId)
				return;

			Rune.actions.setTarget({ newTarget: Vector2.zero() });
			this.lastInputDirection = Vector2.zero();

			window.removeEventListener('pointermove', cbMove);
			window.clearInterval(this.interval);
		};

		const dispatchEvent = () => {
			if (!this.directionChanged || !this.control)
				return;
			const pos = this.lastInputDirection;
			Rune.actions.setTarget({ newTarget: pos });
			this.directionChanged = false;
		};

		const cbDown = onPointerDown.bind(this);
		const cbMove = onPointerMove.bind(this);
		const cbCancel = onPointerCancel.bind(this);

		const dispatch = dispatchEvent.bind(this);

		App.canvas?.addEventListener('pointerdown', cbDown);
		App.canvas?.addEventListener('pointerup', cbCancel);
		App.canvas?.addEventListener('pointercancel', cbCancel);
	}

	public shipSelected(idx: number) {
		Rune.actions.setShip({ id: idx });
		(UI.GetCurrentPanel() as BriefingPanel).HideShipSelection();
	}

	public footerButtonPressed(idx: number) {
		const footer = UI.GetFooterElement(idx - 1);
		footer?.buttonPressed();
		console.log(`Button ${idx} was pressed`);
	}

	public updateState(state: GameState, players: PlayerId[], localPlayer: PlayerId | undefined) {
		this.localPlayerId = localPlayer;
		this.control = state.level.phase == Phase.Level;
		UI.UpdatePlayers(state, players, this.localPlayerId);

		if (localPlayer) {
			switch (state.level.phase) {
				case Phase.None:
					UI.SwitchUI(UI.PanelType.None, state, localPlayer);
					UI.HideFooter();
					break;
				case Phase.Briefing:
					UI.SwitchUI(UI.PanelType.Briefing, state, localPlayer);
					UI.HideFooter();
					break;
				case Phase.Level:
					UI.SwitchUI(UI.PanelType.GameHUD, state, localPlayer);
					UI.UpdateFooter(state, localPlayer);
					break;
				case Phase.Shop:
					UI.SwitchUI(UI.PanelType.Shop, state, localPlayer);
					UI.HideFooter();
					break;
				case Phase.Victory:
				case Phase.Defeat:
					UI.SwitchUI(UI.PanelType.GameOver, state, localPlayer);
					UI.HideFooter();
					break;
			}

			UI.UpdateUIPanel(state, localPlayer);
		}

		//sync the local entity list with the remote one
		this.syncEntityList(state);

		for (const playerId in state.players) {
			const ship = this.renderEntities[playerId];
			if (!ship)
				continue;
			ship.onUpdate(state.players[playerId], state);
		}
		for (const enemyId in state.enemies) {
			const ship = this.renderEntities[enemyId];
			ship.onUpdate(state.enemies[enemyId], state);
		}

		for (const equipmentId in state.equipment) {
			const equip = this.renderEntities[equipmentId];
			equip.onUpdate(state.equipment[equipmentId], state);
		}

		for (const projectileId in state.projectiles) {
			const proj = this.renderEntities[projectileId];
			proj.onUpdate(state.projectiles[projectileId], state);
		}

		if (this.localPlayerId)
			this.localPlayerPosition = state.players[this.localPlayerId].transform.position;

		//Update UI
		UI.UpdatePlayerScores(state.scores);
		
		//Score drops
		UI.UpdateScoreDrops(state.scoreDrops, state);
	}

	private syncEntityList(state: GameState): void {
		const removedEntities = Object.keys(this.renderEntities);

		const players = Object.keys(state.players);
		for (const playerId of players) {
			if (removeFromArray(playerId, removedEntities))
				continue;
			//Player does not exist, so create a new ship entity for it 
			const ship = RenderFactory.CreateShip(playerId, state.players[playerId]);
			this.renderEntities[playerId] = ship;
		}

		const enemies = Object.keys(state.enemies);
		for (const enemyId of enemies) {
			if (removeFromArray(enemyId, removedEntities))
				continue;

			const ship = RenderFactory.CreateShip(enemyId, state.enemies[enemyId]);
			this.renderEntities[enemyId] = ship;
		}

		const equipment = Object.keys(state.equipment);
		for (const equipmentId of equipment) {
			if (removeFromArray(equipmentId, removedEntities))
				continue;

			const equipment = RenderFactory.CreateEquipment(equipmentId, state.equipment[equipmentId]);
			this.renderEntities[equipmentId] = equipment;
		}

		const projectiles = Object.keys(state.projectiles);
		for (const projectileId of projectiles) {
			if (removeFromArray(projectileId, removedEntities))
				continue;

			const projectile = RenderFactory.CreateProjectile(projectileId, state.projectiles[projectileId]);
			this.renderEntities[projectileId] = projectile;
		}

		for (const entityId of removedEntities) {
			if (!entityId)
				continue;
			const entity = this.renderEntities[entityId];
			if (entity)
				entity.onDestroy?.();
			delete this.renderEntities[entityId];
		}

		function removeFromArray(id: string, arr: string[]) {
			const idx = arr.indexOf(id);
			if (idx >= 0) {
				delete arr[idx];
				return true;
			}
			return false;
		}
	}
}