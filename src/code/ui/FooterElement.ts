import { GameClient } from "../../client";
import { AbilitySystem } from "../aura/ability";
import { Ability, AbilityData } from "../databases/dropdatabase";
import { UIElement } from "./UIElement";

export class FooterElement extends UIElement<Ability> {
	cooldownMask: HTMLDivElement | undefined = undefined;
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
				if (child.classList.contains('icon')) {
					(child.children[0] as HTMLImageElement).src = `/assets/${data.sprite}.png`;
				}
			}
		}

	}

	public buttonPressed(): void {
		if (!this.data)
			return;

		if (this.onCooldown)
			return;

		GameClient.sendAbility(this.data.id);

		const cooldown = this.data.cooldown || AbilitySystem.DefaultAbilityCooldown;
		this.abilityActivated(cooldown);
	}

	public abilityActivated(cooldown: number): void {
		this.setEnabled(false);

		this.onCooldown = true;
		if (this.cooldownMask) {
			this.cooldownMask.style.visibility = 'visible';
			this.cooldownMask.style.transition = `height ${cooldown}ms`;
			this.cooldownMask.style.height = 'inherit';
		}

		if (this.element)
			this.element.style.animation = '';
	}

	public abilityReady(): void {
		this.onCooldown = false;

		this.setEnabled(true);
		if (this.cooldownMask) {
			this.cooldownMask.style.height = '0';
			this.cooldownMask.style.transition = `height 0s`;
		}

		if (this.element && this.isVisible()) {
			this.element.style.animation = 'footer-button-bounce-once 0.4s';
		}
	}
}
