import { HeaderElement } from "./HeaderElement";
import { FooterElement } from "./FooterElement";
import { Player, PlayerId, Players } from "rune-games-sdk";

const UIHeaderElements = [
	new HeaderElement('ui_header_player_one'),
	new HeaderElement('ui_header_player_two'),
	new HeaderElement('ui_header_player_three'),
	new HeaderElement('ui_header_player_four')
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
		if (pid && pid in scores) {
			const score = scores[pid];
			el.updateScore(score);
		}
	}
};

export const UpdatePlayers = (players: Players, localPlayerId: PlayerId | undefined) => {
	const assignedPlayers: Record<PlayerId, Player> = {};
	const unassignedUI: HeaderElement[] = [];
	for (let ui of UIHeaderElements) {
		if (ui.PlayerID) {
			//If this ui is assigned to a player that left, disable it
			if (!(ui.PlayerID in players)) {
				ui.Reset();
				unassignedUI.push(ui);
			}
			else {
				assignedPlayers[ui.PlayerID] = players[ui.PlayerID];
			}
		}
		else {
			ui.setVisible(false);
			unassignedUI.push(ui);
		}
	}

	unassignedUI.reverse();

	for (const playerId in players) {
		if (!playerId || playerId in assignedPlayers)
			continue;
		const ui = unassignedUI.pop();
		if (ui) {
			ui.setData(players[playerId]);
			ui.setVisible(true);
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