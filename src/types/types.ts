export type Data = {
	entries: {
		month: number;
		year: number;
		items: {
			[key: string]: number;
		}[];
	}[];
};
