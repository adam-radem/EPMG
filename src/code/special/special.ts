import { PlayerEntityData } from "../entity/player";
import { GameState, NextEntityId } from "../game/game";
import { WeaponEquipmentData } from "../types/shipdata";

declare type SpecialDelegate = (player: PlayerEntityData, weapon: WeaponEquipmentData, state: GameState) => void;

interface SpecialActivation {
	specialType: number;
	special?: SpecialDelegate;
}

export class Specials {
	//[Aura] Decreases weapon cooldown by [value] for 15 seconds
	public static Accelerate(player: PlayerEntityData, weapon: WeaponEquipmentData, state: GameState) {
		const id = NextEntityId(state);
	}

	//[Projectile] Zaps a nearby enemy for [value] multiple damage
	public static ZapOne(player: PlayerEntityData, weapon: WeaponEquipmentData, state: GameState) {
		
	}

	//[Projectile] Zaps up to [value] nearby enemies for damage
	public static ZapAll(player: PlayerEntityData, weapon: WeaponEquipmentData, state: GameState) {

	}

	//[Aura] Absorbs [value] damage from each shot for 15 seconds
	public static Barrier(player: PlayerEntityData, weapon: WeaponEquipmentData, state: GameState) {
		const id = NextEntityId(state);

	}

	public static ActivateSpecial(player: PlayerEntityData, weapon: WeaponEquipmentData, state: GameState) {
		if (weapon.special) {
			const spec = Activators[weapon.special];
			if (spec && spec.special) {
				spec.special.call(undefined, player, weapon, state);
			}
		}
	}
}

const Activators: SpecialActivation[] = [
	{ specialType: 0 },
	{ specialType: 1, special: Specials.Accelerate },
	{ specialType: 2, special: Specials.ZapOne },
	{ specialType: 3, special: Specials.ZapAll },
	{ specialType: 4, special: Specials.Barrier }
];
