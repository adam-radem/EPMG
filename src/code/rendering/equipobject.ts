import { RenderEntity } from "./renderEntity.ts";
import { EquipData } from "../entity/equip.ts";


export class EquipObject implements RenderEntity<EquipData> {

	public constructor(id: EntityId, data: EquipData) {}

	onUpdate(data: EquipData): void {
		// throw new Error("Method not implemented.");
	}
	onCreate?(): void {
		// throw new Error("Method not implemented.");
	}
	onDestroy?(): void {
		// throw new Error("Method not implemented.");
	}

}
