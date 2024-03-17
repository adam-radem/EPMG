import { V2 } from "../math/vector";
import { Screen } from "../rendering/screen";

const Playable = Screen.PlayableArea;
const StartPosY: number = Playable.y - 48;

export class GlobalGameParameters {
	static readonly Debug: boolean = true;

	static readonly GameLevelCount: number = 3;
	static readonly SegmentsPerLevel: number[] = [10, 12, 14];

	static readonly SegmentWidth: number = 720;
	static readonly SegmentHeight: number = 1152;

	static readonly StartPositions = [
		[{ x: 360, y: StartPosY }],
		[{ x: 240, y: StartPosY }, { x: 480, y: StartPosY }],
		[{ x: 180, y: StartPosY }, { x: 360, y: StartPosY }, { x: 540, y: StartPosY }]
	];

	static GetStartPosition(idx: number, cnt: number): V2 {
		return this.StartPositions[cnt][idx];
	}
}
