import { GameClient } from "../../client";
import { AbilitySystem } from "../aura/ability";
import { Ability, AbilityData } from "../databases/dropdatabase";
import { UIElement } from "./UIElement";

export class FooterElement extends UIElement<Ability> {
	cooldownMask: HTMLDivElement | undefined = undefined;
	activeMask: HTMLDivElement | undefined = undefined;
	onCooldown: boolean = false;

	public setPosition(position: string) {
		if (this.element)
			this.element.style.left = position;
	}

	public setData(data: Ability): void {
		const childElements = this.element?.children;
		if (!childElements)
			return;

		this.data = data;

		const len = childElements.length;
		for (let i = 0; i < len; ++i) {
			const child = childElements[i];
			if (child) {
				if (child.classList.contains('cooldown-mask')) {
					this.cooldownMask = child as HTMLDivElement;
				}
				if (child.classList.contains('active-mask')) {
					this.activeMask = child as HTMLDivElement;
				}
				if (child.classList.contains('icon')) {
					(child.children[0] as HTMLImageElement).src = `/assets/${data.sprite}.png`;
				}
			}
		}
	}

	public setCooldownState(currentTime: number, max: number) {
		if (this.cooldownMask)
			this.cooldownMask.style.height = (currentTime / max).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 });
	}

	public setActiveState(timeLeft: number) {
		if (this.activeMask) {
			if (timeLeft > 0) {
				this.activeMask.style.visibility = 'visible';
			}
			else {
				this.activeMask.style.visibility = 'hidden';
			}
		}
	}

	public buttonPressed(): void {
		if (!this.data)
			return;

		if (this.onCooldown)
			return;

		GameClient.sendAbility(this.data.id);

		this.abilityActivated();
	}

	public abilityActivated(): void {
		this.setEnabled(false);

		this.onCooldown = true;
		if (this.cooldownMask) {
			this.cooldownMask.style.visibility = 'visible';
			this.cooldownMask.style.height = '100%';
		}

		if (this.element)
			this.element.style.animation = '';
	}

	public abilityReady(): void {
		this.onCooldown = false;

		this.setEnabled(true);
		if (this.cooldownMask) {
			this.cooldownMask.style.height = '0%';
		}

		if (this.element && this.isVisible()) {
			this.element.style.animation = 'footer-button-bounce-once 0.4s';
		}
	}
}
