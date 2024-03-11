import { UIElement } from "./UIElement";

interface AbilityData {
	cooldown: number;
	icon: string;
};

export class FooterElement extends UIElement<AbilityData> {
	cooldownMask: HTMLDivElement | undefined = undefined;
	onCooldown: boolean = false;

	public setPosition(position: string) {
		if (this.element)
			this.element.style.left = position;
	}

	public setData(data: AbilityData): void {
		const childElements = this.element?.children;
		if (!childElements)
			return;

		const len = childElements.length;
		for (let i = 0; i < len; ++i) {
			const child = childElements[i];
			if (child) {
				if (child.classList.contains('cooldown-mask')) {
					this.cooldownMask = child as HTMLDivElement;
				}
				if (child.classList.contains('icon')) {
					(child.children[0] as HTMLImageElement).src = `/assets/${data.icon}.png`;
				}
			}
		}

	}

	public buttonPressed(): void {
		if (this.onCooldown)
			return;

		this.abilityActivated(2);
		setTimeout(this.abilityReady.bind(this), 2000);
	}

	public abilityActivated(cooldown: number): void {
		this.setEnabled(false);
		this.onCooldown = true;
		if (this.cooldownMask) {
			this.cooldownMask.style.visibility = 'visible';
			this.cooldownMask.style.transition = `height ${cooldown}s`;
			this.cooldownMask.style.height = 'inherit';
		}

		if(this.element)
			this.element.style.animation = '';
	}

	public abilityReady(): void {
		this.onCooldown = false;

		this.setEnabled(true);
		if (this.cooldownMask) {
			this.cooldownMask.style.height = '0';
			this.cooldownMask.style.transition = `height 0s`;
		}

		if(this.element && this.isVisible()){
			this.element.style.animation = 'footer-button-bounce-once 0.4s';
		}
	}
}
