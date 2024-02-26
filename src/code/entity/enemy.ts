import { CircBody } from "./transform";
import { Entity } from "./entity";
import { V2, Vector2 } from "../math/vector";

export interface EnemyEntityData {
	center: V2,
	velocity: V2,
	radius: number;
}

export class EnemyEntity extends Entity<EnemyEntityData> implements CircBody {
	private entityData: EnemyEntityData = {
		center: Vector2.zero(),
		velocity: Vector2.zero(),
		radius: 1
	};

	public updateOrder(): number {
		return 60;	
	}

	public getData(): EnemyEntityData {
		return this.entityData;
	}

	public get center(): V2 {
		return this.entityData.center;
	}

	public get velocity(): V2 {
		return this.entityData.velocity;
	}

	public get radius(): number {
		return this.entityData.radius;
	}
}