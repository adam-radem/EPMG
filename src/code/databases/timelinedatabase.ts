import { timelines } from "../../data/timelinedata.json";
import { LevelTimeline } from "../level/timeline";

const map: Record<number, Partial<LevelTimeline>> = {};
for (const [, v] of Object.entries(timelines)) {
	map[v.id] = v;
}

export function GetTimeline(id: number) {
	return map[id] as LevelTimeline;
}