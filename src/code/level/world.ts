import { GameState } from "../game/game";
import { Level, LevelData, Segment } from "./segment";

interface WorldData {
}

export class World implements WorldData {
	private level?: Level;
	private currentSegment?: Segment;

	public static readonly Current: World = new World();

	public Start(state:GameState) {
		this.level = LevelData.Load(state.level.id);
		this.currentSegment = this.level.getSegment(state.level.segment);
	}

	public onUpdate(state: GameState, timeMS: number) {
		this.currentSegment?.onUpdate?.(state, timeMS);
		if (this.currentSegment?.IsComplete(state)) {
		state.level.segment = state.level.segment + 1;
			this.currentSegment = this.level?.getSegment(state.level.segment + 1);
		}
	}
}