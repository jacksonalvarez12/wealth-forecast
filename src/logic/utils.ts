import type { Entries } from '../types/entries';

export const cleanEntries = (entries: Entries): Entries => {
	return entries
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
};
