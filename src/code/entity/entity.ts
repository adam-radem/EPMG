import { GameState } from "../game/game";
import { Vector2 } from "../math/vector";
import { TransformData } from "./transform";

export type EntityId = number;

export class Entity<T> {
	static LastID: EntityId = 0;

	id: EntityId;
	transform: TransformData;

	constructor() {
		this.id = ++Entity.LastID;
		this.transform = {
			position: Vector2.zero(),
			angle: 0,
			scale: 1
		};
	}

	public updateTransform(transform: TransformData) {
		this.transform = transform;
	}

	public updateOrder(): number { return 100; }
	public onUpdate?(state: GameState): void;
	public onDestroy?(): void;
	public getData?(): T;
}