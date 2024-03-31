import { equipment } from "../../data/equipdata.json";
import { ShipEquipmentData } from "../types/shipdata";

const map: Record<number, Partial<ShipEquipmentData>> = {};
for (const [, v] of Object.entries(equipment)) {
	map[v.type] = v;
}

export function GetEquipmentData(type: number): ShipEquipmentData {
	return map[type] as ShipEquipmentData;
}