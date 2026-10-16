import { convertEntriesToGrid } from '../logic/grid';
import type { Entries, Grid } from '../types/types';

export const Sheet = (opts: { entries: Entries }) => {
	const { entries } = opts;

	const grid: Grid = convertEntriesToGrid(entries);

	let gridStrings: string[] = [];
	grid.forEach((row) => {
		gridStrings.push(`${row.map((item) => item || 'empty').join(' | ')}`);
	});

	return (
		<div>
			{gridStrings.map((gridString) => (
				<p>{gridString}</p>
			))}
		</div>
	);
};
