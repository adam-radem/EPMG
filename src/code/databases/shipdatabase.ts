import { ships } from "../../data/shipdata.json";
import { ShipData } from "../types/shipdata";

const map: Record<number, Partial<ShipData>> = {};
for (const [, v] of Object.entries(ships)) {
	map[v.type] = v;
}

export function GetShipData(type: number): Partial<ShipData> {
	return map[type & 0xF];
}