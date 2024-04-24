declare module "*.jpg" {
	const path: string;
	export default path;
}

declare module "*.png" {
	const path: string;
	export default path;
}

declare type EntityId = number | string;
declare type SpriteID = string | undefined | null;