export enum SWORD {
	BLUE = 'blue-sword',
	RED = 'red-sword',
	GREEN = 'green-sword',
	PURPLE = 'purple-sword',
}

export enum LASER {
	BLUE = 'blue-laser',
	RED = 'red-laser',
	GREEN = 'green-laser',
	PURPLE = 'purple-laser',
}

export enum SLICE {
	BLUE = 'blue-slice',
	RED = 'red-slice',
	GREEN = 'green-slice',
	PURPLE = 'purple-slice',
}

export enum EXPLOSION {
	BLUE = 'blue-explosion',
	RED = 'red-explosion',
	GREEN = 'green-explosion',
	PURPLE = 'purple-explosion',
}

export enum COLORS {
	BLUE = 'blue',
	RED = 'red',
	GREEN = 'green',
	PURPLE = 'purple',
}

export enum PLANET {
	FIRST = 'first-planet',
	SECOND = 'second-planet',
	THIRD = 'third-planet',
	FOURTH = 'fourth-planet',
}

export enum ACHIEVEMENTS_ITEM {
	SWORD = 'sword',
	PLANET = 'planet',
}

export enum MENU_TYPE {
	GAME_OVER = 'game-over',
	PAUSE = 'pause',
}

export interface ISwordItem {
	key: SWORD;
	score: number;
}

export interface IPlanetItem {
	key: PLANET;
	score: number;
}

export interface IAchievement {
	[ACHIEVEMENTS_ITEM.SWORD]: ISwordItem[];
	[ACHIEVEMENTS_ITEM.PLANET]: IPlanetItem[];
}

export interface IAchievementsObject {
	[key: string]: IAchievement;
}

export interface IScoreValues {
	current: number;
	need: number;
}
