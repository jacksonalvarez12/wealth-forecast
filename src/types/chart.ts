export type AccountHistoryPoint = {
	month: number;
	year: number;
	monthIndex: number;
	value: number | null;
	projected: boolean;
};

export type AccountHistory = {
	title: string;
	points: AccountHistoryPoint[];
};
