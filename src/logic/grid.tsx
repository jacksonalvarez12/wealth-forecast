import type { Entries, Grid } from '../types/types';

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

export const convertEntriesToGrid = (entries: Entries): Grid => {
	const sortedEntries: Entries = entries
		.sort((a, b) => {
			if (a.year < b.year) return -1;
			if (a.year > b.year) return 1;
			if (a.month < b.month) return -1;
			if (a.month > b.month) return 1;
			return 0;
		})
		.filter((entry, index) => {
			// Keep only the first entry for each month
			return !(index > 0 && entry.year === entries[index - 1].year && entry.month === entries[index - 1].month);
		});

	const itemNames: Set<string> = new Set<string>();
	for (const entry of sortedEntries) {
		for (const itemName of Object.keys(entry.items)) {
			itemNames.add(itemName);
		}
	}

	const gridEntries: ({ title: string } | { key: string; value: number })[][] = [];
	gridEntries.push(new Array(itemNames.size).fill(undefined));

	for (let gridIndex: number = 1; gridIndex <= sortedEntries.length; gridIndex++) {
		const currentEntryIndex: number = gridIndex - 1;

		const newColumn: ({ title: string } | { key: string; value: number })[] = new Array(itemNames.size).fill(
			undefined
		);
		const additions: { key: string; value: number }[] = [];

		Object.entries(sortedEntries[currentEntryIndex].items).forEach(([key, value]) => {
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

	return finalGrid;
};
