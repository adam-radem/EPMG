import { HeaderElement } from "./HeaderElement";
import { FooterElement } from "./FooterElement";

const UIHeaderElements = [
	new HeaderElement('ui_header_player_one'),
	new HeaderElement('ui_header_player_two')
];

const UIFooterElements = [
	new FooterElement('ui_footer_btn_one'),
	new FooterElement('ui_footer_btn_two'),
	new FooterElement('ui_footer_btn_three'),
	new FooterElement('ui_footer_btn_four')
];

export const GetHeaderElement = (idx: number) => {
	return UIHeaderElements[idx];
};

export const GetFooterElement = (idx: number) => {
	return UIFooterElements[idx];
};

export const UpdatePlayerScores = (scores: Record<string, number>) => {
	for (const el of UIHeaderElements) {
		const pid = el.PlayerID;
		if (pid) {
			const score = scores[pid];
			el.updateScore(score);
		}
	}
};

export const UpdateFooterPositions = () => {
	const count = UIFooterElements.filter(x => x.isVisible()).length;

	const positions = [
		[],
		['calc(50vw - 5vh)'],
		['calc(40vw - 5vh)', 'calc(60vw - 5vh)'],
		['calc(30vw - 5vh)', 'calc(50vw - 5vh)', 'calc(70vw - 5vh)'],
		['calc(20vw - 5vh)', 'calc(40vw - 5vh)', 'calc(60vw - 5vh)', 'calc(80vw - 5vh)'],
	];

	const arrPositions = positions[count];

	let idx = 0;
	for (let i = 0; i < UIFooterElements.length; ++i) {
		const el = UIFooterElements[i];
		if (el.isVisible()) {
			el.setPosition(arrPositions[idx]);
			++idx;
		}
	}
};