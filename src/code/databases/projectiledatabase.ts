import { projectiles } from "../../data/projectiledata.json";
import { ProjectileSpriteData } from "../types/shipdata";

const map: Record<number, Partial<ProjectileSpriteData>> = {};
for (const [, v] of Object.entries(projectiles)) {
	map[v.type] = v;
}

export function GetProjectile(type: number): ProjectileSpriteData {
	return map[type] as ProjectileSpriteData;
}