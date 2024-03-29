import { EntitySystem, EntityData } from "../entity/entity";
import { GameState } from "../game/game";

export interface RenderEntity<T extends EntityData> {
	onUpdate(data: T, state:GameState): void;
	onCreate?(): void;
	onDestroy?(): void;
}