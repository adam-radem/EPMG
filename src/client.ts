import * as UI from './code/ui/UIController';
import * as RenderFactory from "./code/rendering/renderFactory";
import { App, Scene } from './code/rendering/renderer';
import { PlayerId } from "dusk-games-sdk";
import { GameState, Phase } from "./code/game/game";
import { Keyboard, KeyState } from "./code/input/keyboard";
import { RenderEntity } from "./code/rendering/renderEntity";
import { V2, Vector2 } from './code/math/vector';
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
	deletedEntities: EntityId[] = [];

	public static sendAbility(abilityId: number) {
		Dusk.actions.activateAbility({ abilityId: abilityId });
	}

	public registerInput() {
		const onKeyPress = (ev: KeyboardEvent) => {
			if (!this.localPlayerId)
				return;

			const val = parseInt(ev.key);
			if (isNaN(val))
				return;

			const footer = UI.GetFooterElement(val - 1);
			if (footer && footer.isEnabled()) {
				footer.buttonPressed();
			}
		};

		const onPointerDown = (ev: PointerEvent) => {
			if (!this.localPlayerId) //ignore this from spectators
				return;

			const projected = Scene.toLocal({ x: Math.floor(ev.x), y: Math.floor(ev.y) });
			this.directionChanged = true;
			this.lastInputDirection = projected;
			dispatch();
			// Dusk.actions.setTarget({ newTarget: projected });
			// this.lastInputDirection = projected;

			window.addEventListener('pointermove', cbMove);

			if (this.interval)
				window.clearInterval(this.interval);
			this.interval = window.setInterval(dispatch, 125);
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

			Dusk.actions.setTarget({ newTarget: Vector2.zero() });
			this.lastInputDirection = Vector2.zero();

			window.removeEventListener('pointermove', cbMove);
			window.clearInterval(this.interval);
			this.interval = 0;
		};

		const dispatchEvent = () => {
			if (!this.directionChanged || !this.control)
				return;
			const pos = this.lastInputDirection;
			Dusk.actions.setTarget({ newTarget: pos });
			this.directionChanged = false;
		};

		const keystroke = onKeyPress.bind(this);

		const cbDown = onPointerDown.bind(this);
		const cbMove = onPointerMove.bind(this);
		const cbCancel = onPointerCancel.bind(this);

		const dispatch = dispatchEvent.bind(this);

		window.addEventListener('keydown', keystroke);

		App.canvas?.addEventListener('pointerdown', cbDown);
		App.canvas?.addEventListener('pointerup', cbCancel);
		App.canvas?.addEventListener('pointercancel', cbCancel);
	}

	public shipSelected(idx: number) {
		Dusk.actions.setShip({ id: idx });
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
		for (const playerId in state.players) {
			if (playerId in this.renderEntities)
				continue;
			//Player does not exist, so create a new ship entity for it 
			const ship = RenderFactory.CreateShip(playerId, state.players[playerId]);
			this.renderEntities[playerId] = ship;
		}

		for (const enemyId in state.enemies) {
			if (enemyId in this.renderEntities)
				continue;

			const ship = RenderFactory.CreateShip(enemyId, state.enemies[enemyId]);
			this.renderEntities[enemyId] = ship;
		}

		for (const equipmentId in state.equipment) {
			if (equipmentId in this.renderEntities)
				continue;

			const equipment = RenderFactory.CreateEquipment(equipmentId, state.equipment[equipmentId]);
			this.renderEntities[equipmentId] = equipment;
		}

		for (const projectileId in state.projectiles) {
			if (projectileId in this.renderEntities)
				continue;

			const projectile = RenderFactory.CreateProjectile(projectileId, state.projectiles[projectileId]);
			this.renderEntities[projectileId] = projectile;
		}

		for (const id in this.renderEntities) {
			if (id in state.players)
				continue;
			if (id in state.enemies)
				continue;
			if (id in state.equipment)
				continue;
			if (id in state.projectiles)
				continue;

			this.deletedEntities.push(id);
		}

		for (const entityId of this.deletedEntities) {
			const entity = this.renderEntities[entityId];
			if (entity)
				entity.onDestroy?.();
			delete this.renderEntities[entityId];
		}

		this.deletedEntities.length = 0;
	}
}