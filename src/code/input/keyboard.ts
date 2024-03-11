export enum KeyState {
	KeyDown = 1,
	KeyUp = 2
}

type Delegate = () => void;
type KeyboardDelegate = (event: KeyboardEvent) => void;

let CallbackID = 0;
interface KeyboardCallback {
	id: number;
	state: KeyState;
	callback: KeyboardDelegate;
};

export class Keyboard {
	private cleanup: Delegate;
	private stateMap: Record<string, KeyState>;
	private map: KeyboardCallback[];

	public constructor() {
		const keyDownListener = this.onKeyDown.bind(this);
		const keyUpListener = this.onKeyUp.bind(this);

		window.addEventListener('keydown', keyDownListener);
		window.addEventListener('keyup', keyUpListener);

		this.cleanup = () => {
			window.removeEventListener('keydown', keyDownListener);
			window.removeEventListener('keyup', keyUpListener);
			this.map = [];
			this.stateMap = {};
		};

		this.map = [];
		this.stateMap = {};
	}

	public destroy() {
		this.cleanup?.();
	}

	private onKeyDown(key: KeyboardEvent) {
		if (key.repeat || this.stateMap[key.key] === KeyState.KeyDown)
			return;
		this.stateMap[key.key] = KeyState.KeyDown;
		this.invoke(key, KeyState.KeyDown);
	}

	private onKeyUp(key: KeyboardEvent) {
		if (key.repeat || this.stateMap[key.key] === KeyState.KeyUp)
			return;
		this.stateMap[key.key] = KeyState.KeyUp;
		this.invoke(key, KeyState.KeyUp);
	}

	private invoke(event: KeyboardEvent, state: KeyState) {
		for (let i = 0; i != this.map.length; ++i) {
			if (this.map[i].state === state) {
				this.map[i].callback?.(event);
			}
		}
	}

	public subscribe(state: KeyState, callback: KeyboardDelegate): number {
		const eventObj = {
			id: CallbackID++,
			state: state,
			callback: callback,
		};

		this.map.push(eventObj);
		return eventObj.id;
	}

	public unsubscribe(id: number) {
		for (let i = 0; i != this.map.length; ++i) {
			if (this.map[i].id === id) {
				delete this.map[i];
				return;
			}
		}
	}
}