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

export const UpdateFooterPositions = () => {
	const count = UIFooterElements.filter(x => x.isVisible()).length;

	const positions = [
		[],
		['40vw'],
		['25vw', '55vw'],
		['15vw', '40vw', '65vw'],
		['5vw', '27.5vw', '50vw', '72.5vw'],
	];

	const arrPositions = positions[count];

	let idx = 0;
	for (let i = 0; i < UIFooterElements.length; ++i) {
		const el = UIFooterElements[i];
		if(el.isVisible()){
			el.setPosition(arrPositions[idx]);
			++idx;
		}
	}
};