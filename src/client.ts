import * as UI from './code/ui/UIController';
import * as RenderFactory from "./code/rendering/renderFactory";
import { Scene } from './code/rendering/renderer';
import { PlayerId, Players } from "rune-games-sdk";
import { GameState } from "./code/game/game";
import { Keyboard, KeyState } from "./code/input/keyboard";
import { RenderEntity } from "./code/rendering/renderEntity";
import { EntitySystem, ShipEntity } from "./code/entity/entity";
import { V2, Vector2 } from './code/math/vector';
import { Ship } from './code/rendering/ship';
import { PlayerEntityData } from './code/entity/player';

export const MaxPlayers = 2;

type EntityList = Record<string, RenderEntity<any>>;

export class GameClient {
	localPlayerId: PlayerId | undefined;

	interval: number = -1;
	localPlayerPosition: V2 = Vector2.zero();
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

			this.interval = window.setInterval(dispatch, 250);
		};

		const onPointerMove = (ev: PointerEvent) => {
			if (!this.localPlayerId) //ignore this from spectators
				return;

			const projected = Vector2.asVector2(Scene.toLocal({ x: Math.floor(ev.x), y: Math.floor(ev.y) }));
			this.lastInputDirection = projected;

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
			const pos = this.lastInputDirection;
			Rune.actions.setTarget({ newTarget: pos });
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

	public updatePlayers(players: Players, localPlayer: PlayerId | undefined) {
		this.localPlayerId = localPlayer;

		let idx = 0;
		let spectatorCount = 0;
		for (const player in players) {
			const playerData = players[player];
			if (playerData.playerId) {
				const playerHeaderElement = UI.GetHeaderElement(idx);
				if (playerHeaderElement) {
					playerHeaderElement.setData(playerData);
					playerHeaderElement.setVisible(true);
				}
				++idx;
			}
			++spectatorCount;
		}
	}

	public updateState(state: GameState) {
		//sync the local entity list with the remote one
		this.syncEntityList(state);

		for (const playerId in state.players) {
			const ship = this.renderEntities[playerId];
			if (!ship)
				continue;
			ship.onUpdate(state.players[playerId]);
		}
		for (const enemyId in state.enemies) {
			const ship = this.renderEntities[enemyId];
			ship.onUpdate(state.enemies[enemyId]);
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
			const idx = removedEntities.indexOf(playerId);
			if (idx >= 0) {
				//If the player exists, remove it from the array
				delete removedEntities[idx];
				continue;
			}
			//Player does not exist, so create a new ship entity for it 
			const ship = RenderFactory.CreateShip(playerId, state.players[playerId]);
			this.renderEntities[playerId] = ship;
		}

		const enemies = Object.keys(state.enemies);
		for (const enemyId of enemies) {
			const idx = removedEntities.indexOf(enemyId);
			if (idx >= 0) {
				delete removedEntities[idx];
				continue;
			}

			const ship = RenderFactory.CreateShip(enemyId, state.enemies[enemyId]);
			this.renderEntities[enemyId] = ship;
		}

		for (const entityId in removedEntities) {
			const entity = this.renderEntities[entityId];
			if (entity)
				entity.onDestroy?.();
			delete this.renderEntities[entityId];
		}
	}
}