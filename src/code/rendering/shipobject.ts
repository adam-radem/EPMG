import * as Pixi from "pixi.js";
import * as ShipDatabase from "../databases/shipdatabase.ts";
import { ShipEquipment, Ships } from "../types/shipdata.ts";
import { Scene, SpriteData } from "./renderer.ts";
import { RenderEntity } from "./renderEntity.ts";
import { ShipEntity } from "../entity/entity.ts";
import { GlobalGameParameters } from "../game/static.ts";
import { HealthBar } from "./healthBar.ts";

export class ShipObject implements RenderEntity<ShipEntity> {
	shipContainer: Pixi.Container | undefined;
	shipData: ShipEquipment;
	colliderDebug: Pixi.Graphics | undefined;
	healthBar: HealthBar | undefined;
	mainSprite: Pixi.Sprite | undefined;
	deathSprite: Pixi.Sprite | undefined;

	public constructor(id: EntityId, data: ShipEntity) {
		this.shipData = Ships.Empty;
		this.shipContainer = undefined;

		if (!data?.shipData) {
			console.warn("built an empty ship. no rendering will happen.");
			return;
		}

		this.shipContainer = new Pixi.Container();
		this.shipContainer.sortableChildren = true;
		this.shipContainer.pivot.set(0.5, 0);

		const sortId = -id;
		if (!isNaN(sortId))
			this.shipContainer.zIndex = sortId;

		Scene.addChild(this.shipContainer);

		//debug: add collider visualization
		if (GlobalGameParameters.Debug && data.collider) {
			const col = data.collider;
			this.colliderDebug = new Pixi.Graphics();
			this.colliderDebug.beginFill(0x00FF00, 0.1);
			this.colliderDebug.lineStyle(2, 0x00FF00, 0.6);
			this.colliderDebug.zIndex = 2;
			if ('radius' in col) {
				this.colliderDebug.drawCircle(-col.center.x, -col.center.y, col.radius);
			}
			else if ('extents' in col) {
				this.colliderDebug.drawRect(-col.center.x, -col.center.y - col.extents.y, col.extents.x * 2, col.extents.y * 2);
			}
			this.colliderDebug.endFill();
			this.shipContainer.addChild(this.colliderDebug);
		}

		if (data.maxHealth > 0) {
			this.healthBar = new HealthBar();
			this.shipContainer.addChild(this.healthBar.Container);
		}

		this.setShipData(data.shipData);
	}


	private updateHealthBar(ratio: number) {
		this.healthBar?.setHealthValue(ratio);
	}

	public setShipData(shipData: ShipEquipment) {
		if (shipData !== this.shipData) {
			this.shipData = shipData;
			const data = ShipDatabase.GetShipData(shipData.GetShipType());
			if (data) {
				this.updateSprite(data.sprite);
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
		this.mainSprite.anchor.set(0.5, 1);

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

	public onUpdate(data: ShipEntity) {
		if (data?.transform) {
			this.setPosition(data.transform.position.x, data.transform.position.y);
			this.setAngle(data.transform.angle);
		}
		if (data.maxHealth > 0) {
			const ratio = data.health / data.maxHealth;
			this.updateHealthBar(ratio);
			if(data.health <= 0){
				if(this.shipContainer && this.shipContainer.alpha > 0)
					this.shipContainer.alpha -= Rune.msPerUpdate / 500;
			}
		}
	}

	public onCreate() {

	}

	public onDestroy() {
		console.log(`destroying a ship`);
		if (this.colliderDebug)
			this.colliderDebug.destroy();
		if (this.shipContainer)
			this.shipContainer.destroy();
	}
}