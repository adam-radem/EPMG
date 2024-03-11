import { Vector2 } from "../math/vector";

export class Screen {

	// private static _ScreenSize: Vector2 = new Vector2(570, 1024);
	// //The total area of the screen canvas (including all UI)
	// static get ScreenSize(): Vector2 {
	// 	return this._ScreenSize;
	// }

	private static _WorldSize: Vector2 = new Vector2(720, 1152);
	//The area of the playable world on screen (minus the top UI)
	static get WorldSize(): Vector2 {
		return this._WorldSize;
	}
}