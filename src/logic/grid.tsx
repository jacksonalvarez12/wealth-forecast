import type { Classification, Entries, Grid, ItemClassifications } from '../types/entries';
import { cleanEntries } from './utils';

const transpose = (arr: any[][]) => arr[0].map((_, colIndex) => arr.map((row) => row[colIndex]));

const identifyGridRow = (
	gridEntries: ({ title: string } | { key: string; value: number })[][],
	entryItemKey: string,
	gridIndex: number
): number | undefined => {
	for (let i: number = gridIndex - 1; i >= 0; i--) {
		for (let j: number = 0; j < gridEntries[i].length; j++) {
			if (
				(gridEntries[i][j] as any)?.title === entryItemKey ||
				(gridEntries[i][j] as any)?.key === entryItemKey
			) {
				return j;
			}
		}
	}
};

export const convertEntriesToGrid = (
	entries: Entries,
	itemClassifications: ItemClassifications,
	addBreakdown: boolean
): Grid => {
	const cleanedEntries: Entries = cleanEntries(entries);

	const itemNames: Set<string> = new Set<string>();
	for (const entry of cleanedEntries) {
		for (const itemName of Object.keys(entry.items)) {
			itemNames.add(itemName);
		}
	}

	const gridEntries: ({ title: string } | { key: string; value: number })[][] = [];
	gridEntries.push(new Array(itemNames.size).fill(undefined));

	for (let gridIndex: number = 1; gridIndex <= cleanedEntries.length; gridIndex++) {
		const currentEntryIndex: number = gridIndex - 1;

		const newColumn: ({ title: string } | { key: string; value: number })[] = new Array(itemNames.size).fill(
			undefined
		);
		const additions: { key: string; value: number }[] = [];

		Object.entries(cleanedEntries[currentEntryIndex].items).forEach(([key, value]) => {
			const gridRowIndex: number | undefined = identifyGridRow(gridEntries, key, gridIndex);
			if (gridRowIndex !== undefined) {
				newColumn[gridRowIndex] = { key, value };
			} else {
				// Find new spot for it later
				additions.push({ key, value });
			}
		});

		additions.forEach((addition) => {
			// Find first empty spot in LAST column. Then add title there
			const lastColumn: ({ title: string } | { key: string; value: number })[] = gridEntries.at(-1)!;
			const secondToLastColumn: ({ title: string } | { key: string; value: number })[] | undefined =
				gridEntries.at(-2);

			const firstEmptyIndex: number = lastColumn.findIndex((item, index) => {
				if (!!secondToLastColumn && secondToLastColumn[index] !== undefined) {
					return false;
				}
				return item === undefined;
			});
			lastColumn[firstEmptyIndex] = { title: addition.key };

			newColumn[firstEmptyIndex] = { key: addition.key, value: addition.value };
		});

		gridEntries.push(newColumn);
	}

	const finalGrid: Grid = [];
	transpose(gridEntries).forEach((row) => {
		if (row.some((item) => item !== undefined)) {
			const finalRow: (string | number)[] = [];
			row.forEach((item) => {
				if ((item as any)?.title !== undefined) {
					finalRow.push((item as any).title);
				} else if ((item as any)?.value !== undefined) {
					finalRow.push((item as any).value);
				} else {
					finalRow.push('');
				}
			});

			finalGrid.push(finalRow);
		}
	});

	const netWorthRow: (string | number)[] = ['Net Worth'];
	const debtRow: (string | number)[] = ['Debt'];
	const illiquidAssetsRow: (string | number)[] = ['Illiquid Assets'];
	const liquidAssetsRow: (string | number)[] = ['Liquid Assets'];
	for (const entry of cleanedEntries) {
		let netWorth: number = 0;
		let debt: number = 0;
		let illiquidAssets: number = 0;
		let liquidAssets: number = 0;

		for (const [key, value] of Object.entries(entry.items)) {
			netWorth += value;

			const classification: Classification | '' =
				itemClassifications.find((c) => c.itemName === key)?.classification || '';

			if (classification === 'Debt') {
				debt += value;
			} else if (classification === 'Illiquid Asset') {
				illiquidAssets += value;
			} else if (classification === 'Liquid Asset') {
				liquidAssets += value;
			}
		}
		netWorthRow.push(netWorth);
		debtRow.push(debt);
		illiquidAssetsRow.push(illiquidAssets);
		liquidAssetsRow.push(liquidAssets);
	}

	if (addBreakdown) {
		debtRow.some((val) => typeof val === 'number' && val !== 0) && finalGrid.unshift(debtRow);
		liquidAssetsRow.some((val) => typeof val === 'number' && val !== 0) && finalGrid.unshift(liquidAssetsRow);
		illiquidAssetsRow.some((val) => typeof val === 'number' && val !== 0) && finalGrid.unshift(illiquidAssetsRow);
	}
	finalGrid.unshift(netWorthRow);

	// Add headers
	const headers: string[] = [''];
	cleanedEntries.forEach((entry) => {
		headers.push(`${entry.month}/${entry.year % 100}`);
	});
	finalGrid.unshift(headers);

	return finalGrid;
};
