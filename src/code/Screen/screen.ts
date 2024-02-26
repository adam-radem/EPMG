import { Vector2 } from "../math/vector";

export class Screen {

	//The total area of the screen canvas (including all UI)
	static ScreenSize(): Vector2 {
		return Vector2.one();
	}

	//The area of the playable world on screen (minus the top UI)
	static WorldSize(): Vector2 {
		return Vector2.one();
	}
}