import { GameState } from "../game/game";

export interface Segment {
	readonly segmentID: number;

	onUpdate?(state: GameState, timeMS: number): void;
	IsComplete(state: GameState): boolean;
}

class IntroSegment implements Segment {
	segmentID: number;

	constructor(id: number) {
		this.segmentID = id;
	}
	onUpdate?(state: GameState, timeMS: number): void {

	}
	IsComplete(state: GameState): boolean {
		return false;
	}
}

class BossSegment implements Segment {
	public readonly segmentID: number;
	private seed: number;

	constructor(id: number, seed: number) {
		this.segmentID = id;
		this.seed = seed;
	}

	public onUpdate(state: GameState, timeMS: number) {

	}

	public IsComplete(state: GameState): boolean {
		return false;
	}
}

class LevelSegment implements Segment {
	public readonly segmentID: number;
	private seed: number;

	constructor(id: number, seed: number) {
		this.segmentID = id;
		this.seed = seed;
	}

	public onUpdate(state: GameState, timeMS: number) {

	}

	public IsComplete(state: GameState): boolean {
		return false;
	}
}


export interface Level {
	readonly segments: Segment[];
	getSegment(idx: number): Segment | undefined;
}

export class LevelData implements Level {
	readonly seed: number;
	readonly segments: Segment[];

	constructor(seed: number, segmentCount: number) {
		this.seed = seed;

		this.segments = [];
		for (let i = 0; i != segmentCount; ++i) {
			this.segments.push(new LevelSegment(i, Math.random()));
		}
	}

	public getSegment(idx: number): Segment | undefined {
		if (idx < 0 || idx >= this.segments.length)
			return undefined;
		return this.segments[idx];
	}

	public onUpdate(state: GameState, timeMS: number): void {

	}

	public static Load(idx: number): LevelData {
		return new LevelData(0, 0);
	}
}