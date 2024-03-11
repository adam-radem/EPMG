import { Screen } from "../rendering/screen";
import { Entity } from "./entity";
import { V2, Vector2 } from "../math/vector";
import { RectBody } from "./transform";
import { PlayerId } from "rune-games-sdk";
import { GameState } from "../game/game";

export interface PlayerEntityData {
	center: V2;
	extents: V2;
	velocity: V2;
}

export class PlayerEntity extends Entity<PlayerEntityData> implements RectBody {
	public PlayerId: PlayerId;
	
	private entityData: PlayerEntityData = {
		center: Vector2.zero(),
		extents: Vector2.one(),
		velocity: Vector2.zero()
	};

	public constructor(id: PlayerId) {
		super();
		this.PlayerId = id;
	}

	public getData(): PlayerEntityData {
		return this.entityData;	
	}

	public updateOrder(): number {
		return 50;
	}

	public get center(): V2 {
		return this.entityData.center;
	}
	public get extents(): V2 {
		return this.entityData.extents;
	}
	public get velocity(): V2 {
		return this.entityData.velocity;
	}

	public width(): number {
		return this.extents.x * 2;
	}

	public height(): number {
		return this.extents.y * 2;
	}

	public onUpdate(state: GameState): void {
		const data = state.entityData[this.id];
		this.updateData(data);
	}

	public updateData(data: PlayerEntityData): void {
		this.entityData = data;
		
		const velocity = Vector2.asVector2(this.velocity);

		const vel = velocity.clone().multiplyScalar(Rune.msPerUpdate / 1000);

		const WorldSize = Screen.WorldSize;
		
		const minX = this.extents.x;
		const maxX = WorldSize.x - this.extents.x;

		const minY = this.extents.y;
		const maxY = WorldSize.y - this.extents.y;

		const position = Vector2.asVector2(this.transform.position);
		position.add(vel);
		position.clamp(minX, maxX, minY, maxY);
		this.transform.position = position;
	}
}