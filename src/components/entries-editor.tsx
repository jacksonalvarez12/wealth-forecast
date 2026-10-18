import _ from 'lodash';
import { useState } from 'react';
import type { Entries } from '../types/user-data';
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

const AddEntryEditor = (opts: {
	currentEntries: Entries;
	setEntries: (entries: Entries) => void;
	argDate: { month: number; year: number };
	setState: (state: 'Closed' | 'Add' | 'Edit' | 'Delete') => void;
}) => {
	const { currentEntries, setEntries, argDate, setState } = opts;

	const getSuitableItemPrefills = (argDateObj: { month: number; year: number }, currentEntriesObj: Entries) => {
		// Find suitable entry to prefill item keys
		const items: { key: string; value: number }[] = [];

		let entriesWithArgDate: Entries = _.cloneDeep(currentEntriesObj);
		entriesWithArgDate.push({ year: argDateObj.year, month: argDateObj.month, items: {} });
		entriesWithArgDate = cleanEntries(entriesWithArgDate);

		const index: number = entriesWithArgDate.findIndex(
			(entry) => entry.year === argDateObj.year && entry.month === argDateObj.month
		);

		if (index <= 0 && entriesWithArgDate.length > 1) {
			Object.keys(entriesWithArgDate[1].items).forEach((key) => {
				items.push({ key, value: 0 });
			});

			return items;
		} else if (index <= 0) {
			return [];
		} else {
			Object.keys(entriesWithArgDate[index - 1].items).forEach((key) => {
				items.push({ key, value: 0 });
			});

			return items;
		}
	};

	const [prevArgDate, setPrevArgDate] = useState<{ month: number; year: number }>(argDate);
	const [prevCurrentEntries, setPrevCurrentEntries] = useState<Entries>(currentEntries);

	const [addEntry, setAddEntry] = useState<{ key: string; value: number }[]>(
		getSuitableItemPrefills(argDate, currentEntries)
	);

	if (!_.isEqual(argDate, prevArgDate) || !_.isEqual(currentEntries, prevCurrentEntries)) {
		setPrevArgDate(argDate);
		setPrevCurrentEntries(currentEntries);
		setAddEntry(getSuitableItemPrefills(argDate, currentEntries));
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
			<p>{argDate ? `Adding entry for ${argDate.month}/${argDate.year}` : 'Error. Cancel out of this.'}</p>

			{addEntry.map(({ key, value }, index) => (
				<div key={index}>
					<input
						type='text'
						value={key}
						onChange={(e) => {
							const newItems = [...addEntry];
							newItems[index] = { key: e.target.value, value };
							setAddEntry(newItems);
						}}
						required
					/>
					<p>$</p>
					<input
						type='number'
						value={value}
						onChange={(e) => {
							const newItems = [...addEntry];
							newItems[index] = { key, value: parseInt(e.target.value) };
							setAddEntry(newItems);
						}}
						required
					/>
					<button
						type='button'
						onClick={() => {
							const newItems = [...addEntry];
							newItems.splice(index, 1);
							setAddEntry(newItems);
						}}
					>
						Remove
					</button>
				</div>
			))}
			<button
				type='button'
				onClick={() => {
					const newItems = [...addEntry];
					newItems.push({ key: '', value: 0 });
					setAddEntry(newItems);
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
					addEntry.forEach(({ key, value }) => {
						newEntry.items[key] = value;
					});
					setEntries([...currentEntries, newEntry]);
					setState('Closed');
				}}
			>
				Lock In Entry
			</button>
		</div>
	);
};

export const EntriesEditor = (opts: {
	currentEntries: Entries;
	setEntries: (entries: Entries) => void;
	loading: boolean;
}) => {
	const { currentEntries, setEntries, loading } = opts;

	// Closed State
	const [state, setState] = useState<'Closed' | 'Add' | 'Edit' | 'Delete'>('Closed');
	const [argDate, setArgDate] = useState<{ month: number; year: number } | null>({
		month: new Date().getMonth() + 1,
		year: new Date().getFullYear(),
	});

	const renderClosed = () => {
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

	const renderEdit = () => {
		return (
			<div>
				<button onClick={() => setState('Closed')}>Cancel</button>
			</div>
		);
	};

	const renderDelete = () => {
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

	return (
		<div>
			<h2>Entries</h2>
			{loading ? (
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
								<AddEntryEditor
									setEntries={setEntries}
									currentEntries={currentEntries}
									setState={setState}
									argDate={argDate}
								/>
							),
							Edit: renderEdit(),
							Delete: renderDelete(),
						}[state]
					}
				</>
			) : (
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
					{renderClosed()}
				</>
			)}
		</div>
	);
};
