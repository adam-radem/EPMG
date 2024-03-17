import { Screen } from "../rendering/screen";
import { EntitySystem, ShipEntity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { RectBody } from "./transform";
import { PlayerId } from "rune-games-sdk";
import { GameState } from "../game/game";
import { ShipSlot, Ships } from "../types/shipdata";
import { GetShipData } from "../databases/shipdatabase";

export interface PlayerEntityData extends ShipEntity {
	target: V2;
	collider: RectBody;
}

export class PlayerSystem extends EntitySystem<PlayerEntityData> {
	public onUpdate(entity: PlayerEntityData, state: GameState, dt: number): void {
		this.updateData(entity, dt);
	}

	public updateData(data: PlayerEntityData, dt: number): void {
		const targetVector = Vector2.asVector2(data.target);
		if (targetVector.isZero() || targetVector.equals(data.transform.position))
			return;

		const positionVector = Vector2.asVector2(data.transform.position);

		const diffVector = targetVector.clone().subtract(positionVector);

		const shipSpeed = GetShipData(data.shipData)?.speed ?? 15;

		const vel = diffVector.clone().normalize().multiplyScalar(shipSpeed * dt / 1000);
		if (diffVector.sqrMagnitude() <= vel.sqrMagnitude()) {
			data.transform.position = targetVector;
			return;
		}
		const theta = Math.atan2(vel.y, vel.x);
		data.transform.angle = Math.floor(theta * (180 / Math.PI) - 270);

		const WorldSize = Screen.PlayableArea;

		const minX = data.collider.extents.x;
		const maxX = WorldSize.x - data.collider.extents.x;

		const minY = data.collider.extents.y;
		const maxY = WorldSize.y - data.collider.extents.y;

		const position = Vector2.asVector2(data.transform.position);
		position.add(vel);
		position.clamp(minX, maxX, minY, maxY);

		data.transform.position = position;
	}
}