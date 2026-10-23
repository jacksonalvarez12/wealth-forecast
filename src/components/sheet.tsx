import { useQuery } from '@tanstack/react-query';
import { fetchEntries } from '../api/s3';
import { useAppContext } from '../context/hook';
import { convertEntriesToGrid } from '../logic/grid';
import type { Entries, Grid } from '../types/entries';

export const EntryTable = (opts: { entries: Entries }) => {
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

export const Sheet = () => {
	const { user, s3 } = useAppContext();

	const { data: entries, isLoading } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
		staleTime: 5 * 60 * 1000,
	});

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (!entries) {
		return null;
	}

	return <EntryTable entries={entries} />;
};
