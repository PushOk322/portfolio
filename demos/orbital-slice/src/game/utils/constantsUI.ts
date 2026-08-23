import { SWORD, PLANET, IAchievement } from '@/game/utils/types';

export const KEYS = {
	USER: 'gs-user',
	REFRESH: 'gs2-refresh',
};

export const ACHIEVEMENTS: IAchievement = {
	sword: [
		{ key: SWORD.BLUE, score: 0 },
		{ key: SWORD.RED, score: 1000 },
		{ key: SWORD.GREEN, score: 2000 },
		{ key: SWORD.PURPLE, score: 3000 },
	],
	planet: [
		{ key: PLANET.FIRST, score: 50 },
		{ key: PLANET.SECOND, score: 75},
		{ key: PLANET.THIRD, score: 100 },
		{ key: PLANET.FOURTH, score: 150 },
	],
};
