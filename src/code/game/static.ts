export class GlobalGameParameters {
	static readonly GameLevelCount: number = 3;
	static readonly SegmentsPerLevel: number[] = [10, 12, 14];

	static readonly SegmentWidth: number = 720;
	static readonly SegmntHeight: number = 1280;

	static readonly StartPositions = {
		Default: {
			x: 360,
			y: 48
		},
		Multiplayer: [
			{ x: 300, y: 48 },
			{ x: 420, y: 48 }
		]
	};
}
