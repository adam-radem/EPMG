import { V2, Vector2 } from "../math/vector";
import { Screen } from "../rendering/screen";

const Playable = Screen.PlayableArea;
const StartPosY: number = Playable.y - 48;

export class GlobalGameParameters {
	static readonly Debug: boolean = false;
	static readonly FPSCounter: boolean = true;
	static readonly Version: string = "Pre-Alpha v0.8.0";

	static readonly GameLevelCount: number = 3;
	static readonly SegmentsPerLevel: number[] = [10, 12, 14];

	static readonly SegmentWidth: number = 720;
	static readonly SegmentHeight: number = 1152;

	static readonly StartPositions = [
		{ x: 270, y: StartPosY }, { x: 450, y: StartPosY }, { x: 90, y: StartPosY }, { x: 630, y: StartPosY }
	];

	static readonly EnemyCollisionDamage: number = 50;
	static readonly EnemyInvulnerabilityTime = { projectile: 500, collision: 750 };
	static readonly PlayerInvulnerabilityTimer = { projectile: 800, collision: 1900 };

	static readonly MaxShoppingTime: number = 900000;

	static GetStartPosition(idx: number): V2 {
		return Vector2.clone(GlobalGameParameters.StartPositions[idx]);
	}
}
