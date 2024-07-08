import { ShipEntity } from "../entity/entity";
import { ProjectileData } from "../entity/projectile";
import { EquipData } from "../entity/equip";
import { EquipObject } from "./equipobject";
import { ProjectileObject } from "./projectileobject";
import { ShipObject } from "./shipobject";
import { DropEntityData } from "../entity/drop";
import { DropObject } from "./dropobject";

export function CreateShip(id: EntityId, source: ShipEntity): ShipObject {
	return new ShipObject(id, source);
}

export function CreateEquipment(id: EntityId, source: EquipData): EquipObject {
	return new EquipObject(id, source);
}

export function CreateProjectile(id: EntityId, source: ProjectileData): ProjectileObject {
	return new ProjectileObject(id, source);
}

export function CreateDrop(id: EntityId, source: DropEntityData) : DropObject {
	return new DropObject(id, source);
}