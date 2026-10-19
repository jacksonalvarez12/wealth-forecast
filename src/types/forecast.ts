import type { Entries } from './entries';

export type ForecastData = {
	prompt: string;
	entriesWithForecast: Entries;
	code: string;
	endDate: { month: number; year: number };
};
