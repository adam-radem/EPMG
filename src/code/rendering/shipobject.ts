import * as Pixi from "pixi.js";
import * as ShipDatabase from "../databases/shipdatabase.ts";
import { ShipData, ShipEquipment, Ships } from "../types/shipdata.ts";
import { Scene, SpriteData } from "./renderer.ts";
import { RenderEntity } from "./renderEntity.ts";
import { ShipEntity } from "../entity/entity.ts";
import { GlobalGameParameters } from "../game/static.ts";
import { HealthBar } from "./healthBar.ts";
import { GameState } from "../game/game.ts";
import { GetEquipmentData } from "../databases/equipdatabase.ts";
import { Vector2 } from "../math/vector.ts";

export class ShipObject implements RenderEntity<ShipEntity> {
	shipContainer: Pixi.Container;
	shipData: ShipEquipment;
	debug: Pixi.Graphics | undefined;
	healthBar: HealthBar | undefined;
	mainSprite: Pixi.Sprite | undefined;
	deathSprite: Pixi.Sprite | undefined;

	public constructor(id: EntityId, data: ShipEntity) {
		this.shipData = Ships.Empty;

		this.shipContainer = new Pixi.Container();
		this.shipContainer.sortableChildren = true;
		this.shipContainer.pivot.set(0.5, 0.5);
		this.shipContainer.angle = data.transform.angle;
		this.shipContainer.x = data.transform.position.x;
		this.shipContainer.y = data.transform.position.y;

		const sortId = -id;
		if (!isNaN(sortId))
			this.shipContainer.zIndex = sortId;

		Scene.addChild(this.shipContainer);

		this.setShipData(data);
	}


	private updateHealthBar(ratio: number) {
		this.healthBar?.setHealthValue(ratio);
	}

	public setShipData(entity: ShipEntity) {
		const shipData = entity.shipData;
		if (!shipData)
			return;

		if (shipData !== this.shipData) {
			this.shipData = shipData;
			const data = ShipDatabase.GetShipData(shipData.GetShipType());
			if (data) {
				this.updateSprite(data.sprite);
			}

			//debug: add collider visualization
			if (GlobalGameParameters.Debug) {
				if (this.debug)
					this.debug.clear();
				else
					this.debug = new Pixi.Graphics();

				this.debug.pivot.set(0.5, 0.5);
				this.shipContainer.addChild(this.debug);

				this.debug.beginFill(0xFFFFFF, 1);
				this.debug.drawCircle(0, 0, 5);

				const angle = Math.PI / 2;
				const fwd = new Vector2(Math.cos(angle), Math.sin(angle)).normalize().multiplyScalar(entity.speed / 6);
				this.debug.drawCircle(fwd.x, fwd.y, 5);

				this.debug.endFill();

				//Collider debug view
				if (data.collider) {
					const col = data.collider;
					this.debug.beginFill(0x00FF00, 0.1);
					this.debug.lineStyle(2, 0x00FF00, 0.6);
					this.debug.zIndex = 2;
					if ('radius' in col) {
						this.debug.drawCircle(col.center.x, col.center.y, col.radius);
					}
					else if ('extents' in col) {
						this.debug.drawRect(col.center.x - col.extents.x, col.center.y - col.extents.y, col.extents.x * 2, col.extents.y * 2);
					}
					this.debug.endFill();
					this.debug.beginFill(0xFFFFFF, 1);
					this.debug.lineStyle(2, 0xFFFFFF, 0.6);
					this.debug.drawCircle(col.center.x, col.center.y, 5);
					this.debug.endFill();
				}

				//Weapon Debug View
				const leftWeapon = shipData.GetLeftSlot();
				if (leftWeapon) {
					const weaponData = GetEquipmentData(leftWeapon);
					if (weaponData && weaponData.weapon) {
						// this.debug.beginFill(0xFF00FF, 0);
						this.debug.lineStyle(2, 0xFF00FF, 0.7);
						this.debug.drawCircle(weaponData.anchor.x, weaponData.anchor.y, weaponData.weapon.range);
						this.debug.endFill();
					}
				}
				const rightWeapon = shipData.GetRightSlot();
				if (rightWeapon) {
					const weaponData = GetEquipmentData(rightWeapon);
					if (weaponData && weaponData.weapon) {
						// this.debug.beginFill(0xFFFF00, 0.05);
						this.debug.lineStyle(2, 0xFFFF00, 0.7);
						this.debug.drawCircle(weaponData.anchor.x, weaponData.anchor.y, weaponData.weapon.range);
						this.debug.endFill();
					}
				}
			}

			if (entity.maxHealth > 0) {
				this.healthBar = new HealthBar();
				this.shipContainer.addChild(this.healthBar.Container);
			}
		}
	}

	public updateSprite(spriteID: SpriteID) {
		if (this.mainSprite !== undefined) {
			this.shipContainer?.removeChild(this.mainSprite);
		}
		if (!spriteID) {
			this.mainSprite = undefined;
			return;
		}
		this.mainSprite = SpriteData.GetSprite(spriteID);
		this.mainSprite.zIndex = 0;
		this.mainSprite.anchor.set(0.5, 0.5);

		this.shipContainer?.addChild(this.mainSprite);
	}

	public setPosition(x: number, y: number) {
		if (this.shipContainer) {
			this.shipContainer.x = x;
			this.shipContainer.y = y;
		}
	}

	public setAngle(theta: number) {
		if (this.shipContainer)
			this.shipContainer.angle = theta;
	}

	public onUpdate(data: ShipEntity, state: GameState) {
		if (data.shipData != this.shipData) {
			this.setShipData(data);
		}

		if (data?.transform) {
			this.setPosition(data.transform.position.x, data.transform.position.y);
			this.setAngle(data.transform.angle);
		}
		if (data.maxHealth > 0) {
			const ratio = data.health / data.maxHealth;
			this.updateHealthBar(ratio);
			if (data.health <= 0) {
				if (this.shipContainer && this.shipContainer.alpha > 0)
					this.shipContainer.alpha -= Rune.msPerUpdate / 500;
			}
			else if (data.collider.disabledUntil && data.collider.disabledUntil > state.time) {
				const blinkPeriod = 210;
				const blinkTime = (data.collider.disabledUntil - state.time);

				this.mainSprite!.alpha = (blinkTime / blinkPeriod) % 1;
				this.mainSprite!.tint = "0xFFAAAAAA";
			}
			else {
				this.shipContainer!.alpha = 1;
				this.mainSprite!.alpha = 1;
				this.mainSprite!.tint = "0xFFFFFF";
			}
		}
	}

	public onCreate() {

	}

	public onDestroy() {
		if (this.debug)
			this.debug.destroy();
		if (this.shipContainer)
			this.shipContainer.destroy();
	}
}