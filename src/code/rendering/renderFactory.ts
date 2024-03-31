import { ShipEntity } from "../entity/entity";
import { ProjectileData } from "../entity/projectile";
import { EquipData } from "../entity/weapon";
import { EquipObject } from "./equipobject";
import { ProjectileObject } from "./projectileobject";
import { ShipObject } from "./shipobject";

export function CreateShip(id: EntityId, source: ShipEntity): ShipObject {
	return new ShipObject(id, source);
}

export function CreateEquipment(id: EntityId, source: EquipData): EquipObject {
	return new EquipObject(id, source);
}

export function CreateProjectile(id: EntityId, source: ProjectileData): ProjectileObject {
	return new ProjectileObject(id, source);
}