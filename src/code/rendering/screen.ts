import { V2, Vector2 } from "../math/vector";

export class Screen {
	
	private static _WorldSize: V2 = Vector2.makeVector(720, 1152);
	//The area of the playable world on screen (minus the top UI)
	static get WorldSize(): V2 {
		return Vector2.clone(Screen._WorldSize);
	}

	private static _PlayableSize: V2 = Vector2.makeVector(720, 1080);
	static get PlayableArea(): V2 {
		return Vector2.clone(Screen._PlayableSize);
	}
}