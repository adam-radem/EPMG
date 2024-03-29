import * as UI from './code/ui/UIController';
import * as RenderFactory from "./code/rendering/renderFactory";
import { Scene } from './code/rendering/renderer';
import { PlayerId, Players } from "rune-games-sdk";
import { GameState } from "./code/game/game";
import { Keyboard, KeyState } from "./code/input/keyboard";
import { RenderEntity } from "./code/rendering/renderEntity";
import { EntitySystem, ShipEntity } from "./code/entity/entity";
import { V2, Vector2 } from './code/math/vector';
import { ShipObject } from './code/rendering/shipobject';
import { PlayerEntityData } from './code/entity/player';

export const MaxPlayers = 2;

type EntityList = Record<string, RenderEntity<any>>;

export class GameClient {
	localPlayerId: PlayerId | undefined;

	interval: number = -1;
	localPlayerPosition: V2 = Vector2.zero();
	directionChanged: boolean = false;
	lastInputDirection: Vector2 = Vector2.zero();
	renderEntities: EntityList = {};

	public registerInput(keyboard: Keyboard) {
		//debug keys
		const pressedKey = (event: KeyboardEvent) => {
			const map: Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4 };
			const idx = map[event.key];
			if (idx && idx >= 0) {
				const footer = UI.GetFooterElement(idx - 1);
				if (footer) {
					footer.setData({ cooldown: idx, icon: '' });
					footer.setVisible(!footer.isVisible());
					UI.UpdateFooterPositions();
				}
			}
		};
		keyboard.subscribe(KeyState.KeyDown, pressedKey);

		const onPointerDown = (ev: PointerEvent) => {
			if (!this.localPlayerId) //ignore this from spectators
				return;

			const projected = Scene.toLocal({ x: Math.floor(ev.x), y: Math.floor(ev.y) });
			Rune.actions.setTarget({ newTarget: projected });

			window.addEventListener('pointermove', cbMove);

			this.interval = window.setInterval(dispatch, 200);
		};

		const onPointerMove = (ev: PointerEvent) => {
			if (!this.localPlayerId) //ignore this from spectators
				return;

			const projected = Vector2.asVector2(Scene.toLocal({ x: Math.floor(ev.x), y: Math.floor(ev.y) }));
			if (projected.clone().subtract(this.lastInputDirection).sqrMagnitude() > 10) {
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
			if (!this.directionChanged)
				return;
			const pos = this.lastInputDirection;
			Rune.actions.setTarget({ newTarget: pos });
			this.directionChanged = false;
		};

		const cbDown = onPointerDown.bind(this);
		const cbMove = onPointerMove.bind(this);
		const cbCancel = onPointerCancel.bind(this);

		const dispatch = dispatchEvent.bind(this);

		window.addEventListener('pointerdown', cbDown);
		window.addEventListener('pointerup', cbCancel);
		window.addEventListener('pointercancel', cbCancel);
	}

	public footerButtonPressed(idx: number) {
		const footer = UI.GetFooterElement(idx - 1);
		footer?.buttonPressed();
		console.log(`Button ${idx} was pressed`);
	}

	public updateState(state: GameState, players: PlayerId[], localPlayer: PlayerId | undefined) {
		this.localPlayerId = localPlayer;
		UI.UpdatePlayers(state, players, this.localPlayerId);

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

		if (this.localPlayerId)
			this.localPlayerPosition = state.players[this.localPlayerId].transform.position;

		//Update UI
		UI.UpdatePlayerScores(state.scores);
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