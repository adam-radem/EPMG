import { EntitySystem, EntityData } from "../entity/entity";

export interface RenderEntity<T extends EntityData> {
	onUpdate(data: T): void;
	onCreate?(): void;
	onDestroy?(): void;
}