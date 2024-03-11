export class UIElement<T> {
	protected element: HTMLElement | null;

	public constructor(elementID: string) {
		this.element = document.getElementById(elementID);
	}

	public isVisible(): boolean {
		return !this.element?.classList.contains('hidden');
	}

	public isEnabled(): boolean {
		return !this.element?.classList.contains('disabled');
	}

	public setVisible(visible: boolean) {
		if (this.isVisible() === visible)
			return;

		if (visible) {
			this.element?.classList.remove('hidden');
		}
		else {
			this.element?.classList.add('hidden');
		}
	}

	public setEnabled(enabled: boolean) {
		const isEnabled = this.isEnabled();
		if (isEnabled === enabled) {
			return;
		}

		if (enabled) {
			this.element?.classList.remove('disabled');
		}
		else {
			this.element?.classList.add('disabled');
		}
	}

	public setData?(data: T): void;
}
