import { HeaderElement } from "./HeaderElement";
import { FooterElement } from "./FooterElement";
import { Player, PlayerId, Players } from "rune-games-sdk";
import { GameState } from "../game/game";
import { UIElement } from "./UIElement";
import { UIPanel } from "./UIPanel";
import { BriefingPanel } from "./BriefingPanel";
import { EmptyPanel } from "./EmptyPanel";
import { GetAbilityData } from "../aura/ability";

const UIHeaderElements = [
	new HeaderElement('ui_header_player_one'),
	new HeaderElement('ui_header_player_two'),
	new HeaderElement('ui_header_player_three'),
	new HeaderElement('ui_header_player_four')
];

const UIHeaderColors = [`9FE2F5`, `A6F59F`, `F5DF9F`, `F59FA1`];

const UIFooterElements = [
	new FooterElement('ui_footer_btn_one'),
	new FooterElement('ui_footer_btn_two'),
	new FooterElement('ui_footer_btn_three'),
	new FooterElement('ui_footer_btn_four')
];

const CachedPlayerData: Record<PlayerId, Player> = {};

export enum PanelType {
	None = 0,
	Briefing = 1,
	GameHUD = 2,
	Shop = 3,
	GameOver = 4
};
const Panels: Record<PanelType, UIPanel> = {
	0: new EmptyPanel(),
	1: new BriefingPanel(),
	2: new EmptyPanel(),
	3: new EmptyPanel(),
	4: new EmptyPanel()
};
let CurrentUIPanel: UIPanel = Panels[PanelType.None];

export const CurrentPanelType = () => {
	return CurrentUIPanel.Type();
};

export const GetCurrentPanel = () => {
	return CurrentUIPanel;
};

export const SwitchUI = (panel: PanelType, state: GameState, localPlayer: PlayerId) => {
	if (CurrentUIPanel.Type() === panel)
		return;
	CurrentUIPanel.Dismiss?.(state, localPlayer);
	SetUIPanel(panel);
	CurrentUIPanel.Present?.(state, localPlayer);
};

export const SetUIPanel = (panel: PanelType) => {
	CurrentUIPanel = Panels[panel];
};

export const PresentCurrentUI = (state: GameState, localPlayer: PlayerId) => {
	CurrentUIPanel.Present?.(state, localPlayer);
};

export const DismissCurrentUI = (state: GameState, localPlayer: PlayerId) => {
	CurrentUIPanel.Dismiss?.(state, localPlayer);
};

export const UpdateUIPanel = (state: GameState, localPlayer: PlayerId) => {
	CurrentUIPanel.Update?.(state, localPlayer);
};

export const HideFooter = () => {
	for (let i = 0; i != UIFooterElements.length; ++i) {
		UIFooterElements[i].setVisible(false);
	}
};

export const UpdateFooter = (state: GameState, localPlayer: PlayerId) => {
	const playerAbilities = state.playerAbilities[localPlayer].abilities;
	for (let i = 0; i != UIFooterElements.length; ++i) {
		if (i in playerAbilities) {
			const ability = GetAbilityData(playerAbilities[i].id);
			UIFooterElements[i].setData(ability);
			if (!UIFooterElements[i].isVisible()) {
				UIFooterElements[i].setVisible(true);

				if (playerAbilities[i].cooldown > 0)
					UIFooterElements[i].abilityActivated(playerAbilities[i].cooldown);
			}
			
			UIFooterElements[i].setEnabled(playerAbilities[i].cooldown <= 0);
			if(playerAbilities[i].cooldown <= 0)
				UIFooterElements[i].abilityReady();
			continue;
		}
		UIFooterElements[i].setVisible(false);
	}
};

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

export const UpdatePlayers = (state: GameState, players: PlayerId[], localPlayerId: PlayerId | undefined) => {
	for (const pid of players) {
		if (pid in CachedPlayerData)
			continue;
		CachedPlayerData[pid] = Rune.getPlayerInfo(pid);
	}

	const orderedPlayers = [];
	for (const playerId of players) {
		orderedPlayers[state.players[playerId].idx] = playerId;
	}

	const assignedPlayers: Record<PlayerId, Player> = {};
	const unassignedUI: HeaderElement[] = [];
	for (let i = 0; i < UIHeaderElements.length; ++i) {
		const ui = UIHeaderElements[i];
		if (ui.PlayerID) {
			if (ui.PlayerID === localPlayerId) {
				// ui.Element!.style.borderColor = `#${UIHeaderColors[i]}${AlphaMine}`;
				ui.Element!.style.color = `#${UIHeaderColors[i]}`;
			} else {
				// ui.Element!.style.borderColor = `#${UIHeaderColors[i]}${AlphaOthers}`;
				ui.Element!.style.color = `#${UIHeaderColors[i]}`;
			}

			//If this ui is assigned to a player that left, disable it
			if (players.indexOf(ui.PlayerID) < 0) {
				ui.Reset();
				unassignedUI.push(ui);
			}
			else {
				assignedPlayers[ui.PlayerID] = CachedPlayerData[ui.PlayerID];
			}
		}
		else {
			ui.setVisible(false);
			unassignedUI.push(ui);
		}
	}

	unassignedUI.reverse();

	for (const playerId of orderedPlayers) {
		if (!playerId || playerId in assignedPlayers)
			continue;
		const ui = unassignedUI.pop();
		if (ui) {
			ui.setData(CachedPlayerData[playerId]);
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