import type { AccountHistory } from '../types/chart';
import type { Entries, Grid } from '../types/entries';
import { cleanEntries } from './utils';

export const toMonthIndex = (date: { month: number; year: number }): number => date.year * 12 + date.month - 1;

/**
 * Builds the history for the account a clicked sheet cell belongs to.
 *
 * Grid columns line up with the cleaned entries (column 0 holds labels). A row can hold several accounts in
 * sequence, so the clicked cell's account is the nearest label at or to the left of it in that row.
 */
export const buildAccountHistory = (opts: {
	grid: Grid;
	entries: Entries;
	bodyRowIndex: number;
	colIndex: number;
	isSummaryRow: boolean;
	projectedAfter?: number;
}): AccountHistory | undefined => {
	const { grid, entries, bodyRowIndex, colIndex, isSummaryRow, projectedAfter } = opts;

	const row = grid[bodyRowIndex + 1];
	if (!row) {
		return undefined;
	}

	let title: string | undefined;
	for (let i = colIndex; i >= 0; i--) {
		const cell = row[i];
		if (typeof cell === 'string' && cell !== '') {
			title = cell;
			break;
		}
	}
	if (!title) {
		return undefined;
	}

	const cleanedEntries: Entries = cleanEntries([...entries]);
	const toPoint = (entry: Entries[0], value: number | null) => {
		const monthIndex = toMonthIndex(entry);
		return {
			month: entry.month,
			year: entry.year,
			monthIndex,
			value,
			projected: projectedAfter !== undefined && monthIndex > projectedAfter,
		};
	};

	// Net Worth and breakdown rows are totals computed per column, so read them straight from the grid
	if (isSummaryRow) {
		return {
			title,
			points: cleanedEntries.map((entry, index) => {
				const cell = row[index + 1];
				return toPoint(entry, typeof cell === 'number' ? cell : null);
			}),
		};
	}

	const key = title;
	const firstIndex = cleanedEntries.findIndex((entry) => key in entry.items);
	const lastIndex = cleanedEntries.findLastIndex((entry) => key in entry.items);
	if (firstIndex < 0) {
		return undefined;
	}

	return {
		title,
		points: cleanedEntries
			.slice(firstIndex, lastIndex + 1)
			.map((entry) => toPoint(entry, key in entry.items ? entry.items[key] : null)),
	};
};
