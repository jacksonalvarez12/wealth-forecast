export type Entries = {
	month: number;
	year: number;
	items: {
		[key: string]: number;
	};
}[];

export type Grid = (string | number)[][];

export type Classification = 'Debt' | 'Illiquid Asset' | 'Liquid Asset';

export type ItemClassifications = {
	itemName: string;
	classification?: Classification | '';
}[];
