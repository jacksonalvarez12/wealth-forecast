import { useQuery } from '@tanstack/react-query';
import { useState, type CSSProperties } from 'react';
import { fetchEntries, fetchItemClassifications } from '../api/s3';
import { useAppContext } from '../context/hook';
import { convertEntriesToGrid } from '../logic/grid';
import { buildAccountHistory, toMonthIndex } from '../logic/history';
import { cleanEntries } from '../logic/utils';
import type { AccountHistory } from '../types/chart';
import type { Entries, Grid, ItemClassifications } from '../types/entries';
import { AccountChartModal } from './account-chart-modal';

const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0,
});

// Negative values reach full red at this magnitude and fade toward the text color below it
const NEGATIVE_FULL_RED_AT = 10000;

const negativeStyle = (value: number): CSSProperties | undefined =>
	value < 0 ? ({ '--neg-t': Math.min(Math.abs(value) / NEGATIVE_FULL_RED_AT, 1) } as CSSProperties) : undefined;

const SUMMARY_LABELS = ['Illiquid Assets', 'Liquid Assets', 'Debt'];

const EntryTable = (opts: { entries: Entries; itemClassifications: ItemClassifications; projectedAfter?: number }) => {
	const { entries, itemClassifications, projectedAfter } = opts;

	const [showBreakdown, setShowBreakdown] = useState(false);
	const [chartHistory, setChartHistory] = useState<AccountHistory | undefined>(undefined);

	const grid: Grid = convertEntriesToGrid(entries, itemClassifications, showBreakdown);

	// Purely visual: Net Worth (omitted when all zero) leads the body, breakdown rows follow it when shown
	const rows = grid.slice(1);
	const totalRowCount = rows[0]?.[0] === 'Net Worth' ? 1 : 0;
	let summaryRowCount = totalRowCount;
	if (showBreakdown) {
		while (summaryRowCount < totalRowCount + 3 && SUMMARY_LABELS.includes(String(rows[summaryRowCount]?.[0]))) {
			summaryRowCount++;
		}
	}
	const rowClassName = (rowIndex: number) => {
		if (rowIndex < totalRowCount) return 'table__row--total';
		if (rowIndex < summaryRowCount) {
			return `table__row--summary${rowIndex === summaryRowCount - 1 ? ' table__row--summary-last' : ''}`;
		}
		return undefined;
	};

	const openChart = (rowIndex: number, colIndex: number) => {
		const history = buildAccountHistory({
			grid,
			entries,
			bodyRowIndex: rowIndex,
			colIndex,
			isSummaryRow: rowIndex < summaryRowCount,
			projectedAfter,
		});
		if (history) {
			setChartHistory(history);
		}
	};

	return (
		<div className='sheet'>
			<div className='toolbar'>
				<button
					className='btn btn--secondary btn--sm'
					onClick={() => setShowBreakdown(!showBreakdown)}
				>
					{showBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
				</button>
			</div>
			<div className='table-wrap'>
				<table className='table'>
					<thead>
						<tr>
							{grid[0].map((item, index) => (
								<th key={index}>{item}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, rowIndex) => (
							<tr
								key={rowIndex}
								className={rowClassName(rowIndex)}
							>
								{row.map((item, index) => (
									<td
										key={index}
										className={
											typeof item === 'number'
												? item < 0
													? 'num num--negative'
													: 'num'
												: item !== '' && (index > 0 || rowIndex >= summaryRowCount)
													? 'cell-label'
													: undefined
										}
										style={typeof item === 'number' ? negativeStyle(item) : undefined}
										{...(item !== '' && {
											tabIndex: 0,
											'data-clickable': true,
											title: 'View history',
											onClick: () => openChart(rowIndex, index),
											onKeyDown: (e: React.KeyboardEvent) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													openChart(rowIndex, index);
												}
											},
										})}
									>
										{typeof item === 'number' ? (
											currencyFormatter.format(item)
										) : item === '' && index > 0 ? (
											<span className='muted'>—</span>
										) : (
											item
										)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{chartHistory && (
				<AccountChartModal
					history={chartHistory}
					onClose={() => setChartHistory(undefined)}
				/>
			)}
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
		return <p className='loading loading--sheet'>Loading…</p>;
	}

	if (!itemClassifications || isLoadingItemClassifications) {
		return <p className='loading loading--sheet'>Loading…</p>;
	}

	if ((entriesParam || entries!).length === 0) {
		return (
			<p className='empty empty--sheet'>
				{entriesParam
					? 'No forecast yet.'
					: 'No entries yet. Add your first month of balances in Monthly Entries.'}
			</p>
		);
	}

	// On a forecast sheet, months after the latest real entry are projections
	const latestActual = entriesParam && entries?.length ? cleanEntries([...entries]).at(-1) : undefined;

	return (
		<EntryTable
			entries={entriesParam || entries!}
			itemClassifications={itemClassifications}
			projectedAfter={latestActual ? toMonthIndex(latestActual) : undefined}
		/>
	);
};
