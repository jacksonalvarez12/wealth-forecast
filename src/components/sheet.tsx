import { convertEntriesToGrid } from '../logic/grid';
import type { Entries, Grid } from '../types/types';

export const Sheet = (opts: { entries: Entries }) => {
	const { entries } = opts;

	const grid: Grid = convertEntriesToGrid(entries);

	return (
		<div>
			<table>
				<thead>
					<tr>
						{grid[0].map((item, index) => (
							<th key={index}>{item}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{grid.slice(1).map((row, rowIndex) => (
						<tr key={rowIndex}>
							{row.map((item, index) => (
								<td key={index}>{item}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
