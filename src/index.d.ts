declare module "*.jpg" {
	const path: string;
	export default path;
}

declare module "*.png" {
	const path: string;
	export default path;
}

declare module 'cardinal-spline-js' {
	function getCurvePoints(h, t?, f?, c?);
}

declare type EntityId = number | string;
declare type SpriteID = string | undefined | null;