import { ShipEntity } from "../entity/entity";
import { Ship } from "./ship";

export function CreateShip(id: EntityId, source: ShipEntity): Ship {
	return new Ship(id, source);
}