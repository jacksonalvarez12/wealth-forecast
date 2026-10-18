import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useState } from 'react';
import { fetchEntries, updateEntries } from '../api/s3';
import { useAppContext } from '../context/hook';
import type { Entries } from '../types/entries';
import { cleanEntries } from '../utils';

const debugEntries: Entries = [
	{
		month: 2,
		year: 2026,
		items: {
			'401k': 1500,
			HYSA: 7000,
			'Student Loans': -10000,
			'Roth IRA': 5000,
		},
	},
	{
		month: 12,
		year: 2025,
		items: {
			'401k': 1000,
			'Auto Loan': -3000,
			HYSA: 10000,
		},
	},
	{
		month: 1,
		year: 2026,
		items: {
			'401k': 1000,
			HYSA: 10000,
			'Roth IRA': 4000,
		},
	},
	{
		month: 11,
		year: 2025,
		items: {
			'401k': 1000,
			'Auto Loan': -5000,
			HYSA: 10000,
			'Credit Card Debt': -500,
		},
	},
];

const EntryEditor = (opts: {
	type: 'New' | 'Existing';
	currentEntries: Entries;
	setEntries: (entries: Entries) => void;
	argDate: { month: number; year: number };
	setState: (state: 'Closed' | 'Add' | 'Edit' | 'Delete') => void;
}) => {
	const { type, currentEntries, setEntries, argDate, setState } = opts;

	const getSuitableItemPrefills = (
		argDateObj: { month: number; year: number },
		currentEntriesObj: Entries,
		typeStr: 'New' | 'Existing'
	) => {
		// Find suitable entry to prefill item keys
		const items: { key: string; value: number }[] = [];

		let entriesWithArgDate: Entries = _.cloneDeep(currentEntriesObj);

		if (typeStr === 'New') {
			entriesWithArgDate.push({ year: argDateObj.year, month: argDateObj.month, items: {} });
			entriesWithArgDate = cleanEntries(entriesWithArgDate);
		}

		const index: number = entriesWithArgDate.findIndex(
			(entry) => entry.year === argDateObj.year && entry.month === argDateObj.month
		);

		if (index < 0) {
			return [];
		}

		if (typeStr === 'Existing') {
			Object.entries(entriesWithArgDate[index].items).forEach(([key, value]) => {
				items.push({ key, value });
			});
		} else if (index === 0 && entriesWithArgDate.length > 1) {
			// Inserting entry before all other ones
			Object.keys(entriesWithArgDate[1].items).forEach((key) => {
				items.push({ key, value: 0 });
			});
		} else {
			Object.keys(entriesWithArgDate[index - 1].items).forEach((key) => {
				items.push({ key, value: 0 });
			});
		}

		return items;
	};

	const [prevArgDate, setPrevArgDate] = useState<{ month: number; year: number }>(argDate);
	const [prevCurrentEntries, setPrevCurrentEntries] = useState<Entries>(currentEntries);
	const [prevType, setPrevType] = useState<'New' | 'Existing'>(type);

	const [entry, setEntry] = useState<{ key: string; value: number }[]>(
		getSuitableItemPrefills(argDate, currentEntries, type)
	);

	if (!_.isEqual(argDate, prevArgDate) || !_.isEqual(currentEntries, prevCurrentEntries) || type !== prevType) {
		setPrevArgDate(argDate);
		setPrevCurrentEntries(currentEntries);
		setPrevType(type);
		setEntry(getSuitableItemPrefills(argDate, currentEntries, type));
	}

	return (
		<div>
			<button
				onClick={() => {
					setState('Closed');
				}}
			>
				Cancel
			</button>
			<p>
				{argDate
					? `${type === 'New' ? 'Adding' : 'Editing'} entry for ${argDate.month}/${argDate.year}`
					: 'Error. Refresh the page.'}
			</p>

			{entry.map(({ key, value }, index) => (
				<div key={index}>
					<input
						type='text'
						value={key}
						onChange={(e) => {
							const newItems = [...entry];
							newItems[index] = { key: e.target.value, value };
							setEntry(newItems);
						}}
						required
					/>
					<p>$</p>
					<input
						type='number'
						value={Number.isNaN(value) ? '' : value}
						onChange={(e) => {
							const newItems = [...entry];
							newItems[index] = {
								key,
								value: e.target.value === '' ? NaN : parseInt(e.target.value),
							};
							setEntry(newItems);
						}}
						required
					/>
					<button
						type='button'
						onClick={() => {
							const newItems = [...entry];
							newItems.splice(index, 1);
							setEntry(newItems);
						}}
					>
						Remove
					</button>
				</div>
			))}
			<button
				type='button'
				onClick={() => {
					const newItems = [...entry];
					newItems.push({ key: '', value: 0 });
					setEntry(newItems);
				}}
			>
				Add Item
			</button>
			<button
				onClick={() => {
					const newEntry: Entries[0] = {
						...argDate,
						items: {},
					};
					entry.forEach(({ key, value }) => {
						newEntry.items[key] = value;
					});
					setEntries([
						...currentEntries.filter(
							(entry) => !(entry.year === argDate?.year && entry.month === argDate?.month)
						),
						newEntry,
					]);
					setState('Closed');
				}}
				disabled={entry.length === 0 || entry.some(({ key, value }) => key === '' || !Number.isFinite(value))}
			>
				Lock In Entry
			</button>
		</div>
	);
};

export const EntriesEditor = () => {
	const { user, s3 } = useAppContext();

	const queryClient = useQueryClient();
	const {
		data: currentEntries,
		isLoading,
		isRefetching,
	} = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
	});
	const { mutate, isPending } = useMutation({
		mutationFn: async ({ entries }: { entries: Entries }) => updateEntries(s3, user.userId, entries),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['entries'] });
		},
		retry: 1,
	});

	const setEntries = (entries: Entries) => {
		mutate({ entries });
	};

	// Closed State
	const [state, setState] = useState<'Closed' | 'Add' | 'Edit' | 'Delete'>('Closed');
	const [argDate, setArgDate] = useState<{ month: number; year: number } | null>({
		month: new Date().getMonth() + 1,
		year: new Date().getFullYear(),
	});

	const renderClosed = () => {
		if (!currentEntries) {
			throw Error('ERROR STATE: No current entries in renderClosed');
		}

		return (
			<div>
				<input
					type={'month'}
					onChange={(e) => {
						if (e.target.value === '') {
							setArgDate(null);
							return;
						}

						const month: number = parseInt(e.target.value.split('-')[1]);
						const year: number = parseInt(e.target.value.split('-')[0]);
						setArgDate({ month, year });
					}}
					value={argDate ? `${argDate.year}-${argDate.month < 10 ? `0${argDate.month}` : argDate.month}` : ''}
				/>
				<button
					onClick={() => setState('Add')}
					disabled={
						!argDate ||
						currentEntries.some((entry) => entry.year === argDate?.year && entry.month === argDate?.month)
					}
				>
					Add
				</button>
				<button
					onClick={() => setState('Edit')}
					disabled={
						!argDate ||
						!currentEntries.some((entry) => entry.year === argDate?.year && entry.month === argDate?.month)
					}
				>
					Edit
				</button>
				<button
					onClick={() => setState('Delete')}
					disabled={
						!argDate ||
						!currentEntries.some((entry) => entry.year === argDate?.year && entry.month === argDate?.month)
					}
				>
					Delete
				</button>
			</div>
		);
	};

	const renderDelete = () => {
		if (!currentEntries) {
			throw Error('ERROR STATE: No current entries in renderDelete');
		}

		return (
			<div>
				<button onClick={() => setState('Closed')}>Cancel</button>
				<button
					onClick={() => {
						const newEntries = currentEntries.filter(
							(entry) => !(entry.year === argDate?.year && entry.month === argDate?.month)
						);
						setEntries(newEntries);
						setState('Closed');
					}}
				>
					Delete {argDate?.month}/{argDate?.year} Entry
				</button>
			</div>
		);
	};

	if (isLoading) {
		return null;
	}

	if (!currentEntries) {
		return <p>No entries found</p>;
	}

	return (
		<div>
			{isRefetching || isPending ? (
				<p>Loading...</p>
			) : argDate ? (
				<>
					{/* TODO: Remove debug button */}
					<button
						onClick={() => {
							setEntries(debugEntries);
							setState('Closed');
						}}
					>
						Debug
					</button>
					{
						{
							Closed: renderClosed(),
							Add: (
								<EntryEditor
									type={'New'}
									setEntries={setEntries}
									currentEntries={currentEntries}
									setState={setState}
									argDate={argDate}
								/>
							),
							Edit: (
								<EntryEditor
									type={'Existing'}
									setEntries={setEntries}
									currentEntries={currentEntries}
									setState={setState}
									argDate={argDate}
								/>
							),
							Delete: renderDelete(),
						}[state]
					}
				</>
			) : (
				renderClosed()
			)}
		</div>
	);
};
