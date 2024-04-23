import { GetTimeline } from "../databases/timelinedatabase";
import { GameState, Phase, Systems } from "../game/game";
import { Phases } from "../phases/Phases";
import { Ships } from "../types/shipdata";

interface TimelineEvent {
	startTime: number;
	interval: number;
	count: number;
}

interface SpawnEnemyEvent extends TimelineEvent {
	enemies: number[];
}

function isSpawnEnemyEvent(event: TimelineEvent): event is SpawnEnemyEvent {
	return (event as SpawnEnemyEvent).enemies !== undefined;
}

export interface LevelTimeline {
	id: number;
	events: TimelineEvent[];
}

export class LevelRunner {
	public Run(state: GameState, dt: number) {
		const timeline = this.GetTimeline(state.level.id);
		const eventIdx = state.level.eventIdx;
		const prevProgress = state.level.progress;

		//Check for level completion conditions:
		//No more events! Level is complete
		if (eventIdx >= timeline.events.length) {
			//Wait for enemies to be defeated.
			if (Object.keys(state.enemies).length > 0) {
				return;
			}

			state.level.progress += dt;
			if (state.level.progress < 1000) {
				return;
			}
			//All enemies have been defeated! 
			//If this is level 5, go to victory
			if (state.level.id >= 5) {
				Phases.SetPhase(state, Phase.Victory);
				return;
			}
			Phases.SetPhase(state, Phase.Shop);
			return;
		}

		state.level.progress += dt;
		const eventData = timeline.events[eventIdx];
		this.ProcessEvent(state, eventData, prevProgress);

		if (state.level.eventIdx >= timeline.events.length)
			state.level.progress = 0;
	}

	private ProcessEvent(state: GameState, event: TimelineEvent, prevTime: number) {
		const startTime = event.startTime;
		//Not yet started! Ignore everything else
		if (state.level.progress < startTime)
			return;

		const endTime = event.startTime + (event.interval * event.count);
		//Complete - progress to the next event and exit 
		if (state.level.progress > endTime) {
			state.level.eventIdx++;
			return;
		}

		for (var i = 0; i < event.count; ++i) {
			const startTime = (i * event.interval) + event.startTime;
			if (prevTime < startTime && state.level.progress >= startTime) {
				this.InvokeEvent(state, event);
			}
		}
	}

	private InvokeEvent(state: GameState, event: TimelineEvent) {
		if (isSpawnEnemyEvent(event)) {
			const randomEnemyIdx = Math.floor(Math.random() * event.enemies.length);
			const enemyId = event.enemies[randomEnemyIdx];
			Systems.enemy.CreateEnemy(Ships.Enemies[enemyId], state);
		}
	}

	private GetTimeline(id: number): LevelTimeline {
		return GetTimeline(id);
	}
}