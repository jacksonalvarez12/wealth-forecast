import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchEntries, fetchItemClassifications } from '../api/s3';
import { useAppContext } from '../context/hook';
import { convertEntriesToGrid } from '../logic/grid';
import type { Entries, Grid, ItemClassifications } from '../types/entries';

const EntryTable = (opts: { entries: Entries; itemClassifications: ItemClassifications }) => {
	const { entries, itemClassifications } = opts;

	const [showBreakdown, setShowBreakdown] = useState(false);

	const grid: Grid = convertEntriesToGrid(entries, itemClassifications, showBreakdown);

	return (
		<div>
			<button onClick={() => setShowBreakdown(!showBreakdown)}>
				{showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
			</button>
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

export const Sheet = (opts: { entriesParam?: Entries }) => {
	const { entriesParam } = opts;

	const { user, s3 } = useAppContext();

	const { data: entries, isLoading: isLoadingEntries } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
		staleTime: 5 * 60 * 1000,
	});

	const { data: itemClassifications, isLoading: isLoadingItemClassifications } = useQuery({
		queryKey: ['classifications'],
		queryFn: () => fetchItemClassifications(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
		staleTime: 5 * 60 * 1000,
	});

	if (!entriesParam && (!entries || isLoadingEntries)) {
		return <p>Loading...</p>;
	}

	if (!itemClassifications || isLoadingItemClassifications) {
		return <p>Loading...</p>;
	}

	return (
		<EntryTable
			entries={entriesParam || entries!}
			itemClassifications={itemClassifications}
		/>
	);
};
