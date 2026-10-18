export type Entries = {
	month: number;
	year: number;
	items: {
		[key: string]: number;
	};
}[];

export type Grid = (string | number)[][];
