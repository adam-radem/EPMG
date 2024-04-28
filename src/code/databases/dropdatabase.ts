import { drops } from "../../data/dropdata.json";
import { DropEntityData } from "../entity/drop";
import { EnemyEntityData } from "../entity/enemy";
import { GetShipType } from "../types/shipdata";
import { GetShipData } from "./shipdatabase";

interface WeightedDrop {
	type: number;
	weight: number;
}

export interface DropTable {
	drops: Array<WeightedDrop>;
}

export enum DropType {
	//Nothing dropped!
	None = 0,

	/* Passive - Automatically Applies */
	//Basic: 0 - 7
	Health = 1, 			//Restores health instantly
	Score = 2, 				//Adds score immediately
	Regenerate = 3, 		//Restores health over time for [duration]

	/* Activated */
	//Weapon Buffs: 8 - 15
	WeaponDamage = 8,		//Increases damage dealt by [value] for [duration]
	WeaponInterval = 9, 	//Increases fire rate of weapon by [value] for [duration]
	ShotPierce = 10,		//Adds [value] pierce to weapon for [duration]
	ShotSpread = 11,		//Adds [value] additional shots to weapon for [duration]

	//Barrier Buffs: 16 - 23
	BarrierAbsorb = 16,		//Absorbs damage from projectiles up to [value] for [duration]
	BarrierReflect = 17,	//Reflects up to [value] enemy projectiles
	BarrierHeal = 18,		//Heals up to [value] health from projectiles for [duration]
	BarrierArmor = 19,		//Absorbs up to [value] damage from collisions

	//Special Weapons: 24-31
	ExtraLasers = 24,		//Fires an extra laser at every enemy on screen dealing flat damage
	SpreadMissiles = 25,	//Fires a heat-seeking missile at every enemy on screen dealing damage
	ScreenNuke = 31,		//Hits every enemy screen for massive damage

}
export interface DropData {
	id: number,
	name: string,
	dropType: DropType,
	value: number;
	duration: number | undefined;
	sprite: string | undefined,
}

const map: Record<number, Partial<DropData>> = {};
for (const [, v] of Object.entries(drops)) {
	map[v.id] = v;
}
export function GetDrop(id: number): DropData {
	return map[id] as DropData;
}

export function EvaluateDrop(enemy: EnemyEntityData) {
	const enemyType = GetShipType(enemy.shipData);
	const enemyData = GetShipData(enemyType);

	if (enemyData.drops && enemyData.drops.drops.length > 0) {
		let seed = enemy.seed / 65535.0;
		let totalWeight = 0;

		enemyData.drops.drops.forEach(x => totalWeight += x.weight);
		for (let i = 0; i != enemyData.drops.drops.length; ++i) {
			const drop = enemyData.drops.drops[i];
			seed -= drop.weight / totalWeight;
			if (seed <= 0) {
				return drop;
			}
		}
	}

	return undefined;
}