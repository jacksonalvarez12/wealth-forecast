export type Entries = {
	month: number;
	year: number;
	items: {
		[key: string]: number;
	};
}[];

export type Data = {
	entries: Entries;
};

export type Grid = (string | number)[][];
