import { PanelType } from "./UIController";
import { UIPanel } from "./UIPanel";


export class EmptyPanel implements UIPanel {
	public Type(): PanelType {
		return PanelType.None;
	}
}
