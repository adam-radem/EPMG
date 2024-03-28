import { ProjectileData } from "../entity/projectile.ts";
import { RenderEntity } from "./renderEntity.ts";


export class ProjectileObject implements RenderEntity<ProjectileData> {

	public constructor(id: EntityId, data: ProjectileData) {

	}

	onUpdate(data: ProjectileData): void {
		// throw new Error("Method not implemented.");
	}
	onCreate?(): void {
		// throw new Error("Method not implemented.");
	}
	onDestroy?(): void {
		// throw new Error("Method not implemented.");
	}

}
