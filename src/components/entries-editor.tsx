import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { useState } from 'react';
import { fetchEntries, updateEntries } from '../api/s3';
import { useAppContext } from '../context/hook';
import { cleanEntries } from '../logic/utils';
import type { Entries } from '../types/entries';

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
	): { key: string; value: number }[] => {
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
		} else if (index === 0 && entriesWithArgDate.length === 1) {
			return [];
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
		<div className='editor'>
			<div className='editor__header'>
				<p className='editor__title'>
					{argDate
						? `${type === 'New' ? 'Adding' : 'Editing'} entry for ${argDate.month}/${argDate.year}`
						: 'Error. Refresh the page.'}
				</p>
				<button
					className='btn btn--ghost btn--sm'
					onClick={() => {
						setState('Closed');
					}}
				>
					Cancel
				</button>
			</div>

			<div className='editor__rows'>
				{entry.length === 0 && <p className='empty'>No accounts yet. Click Add Item to add one.</p>}
				{entry.map(({ key, value }, index) => (
					<div
						key={index}
						className='item-row'
					>
						<input
							className='input item-row__name'
							type='text'
							placeholder='Account name'
							aria-label='Account name'
							value={key}
							onChange={(e) => {
								const newItems = [...entry];
								newItems[index] = { key: e.target.value, value };
								setEntry(newItems);
							}}
							required
						/>
						<div className='input-group item-row__value'>
							<span
								className='input-group__prefix'
								aria-hidden='true'
							>
								$
							</span>
							<input
								className='input'
								type='number'
								aria-label='Balance'
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
						</div>
						<button
							type='button'
							className='btn btn--ghost btn--sm item-row__remove'
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
			</div>
			<div className='btn-row'>
				<button
					type='button'
					className='btn btn--secondary'
					onClick={() => {
						const newItems = [...entry];
						newItems.push({ key: '', value: 0 });
						setEntry(newItems);
					}}
				>
					Add Item
				</button>
				<button
					className='btn btn--primary'
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
					disabled={
						entry.length === 0 || entry.some(({ key, value }) => key === '' || !Number.isFinite(value))
					}
				>
					Lock In Entry
				</button>
			</div>
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
		staleTime: 5 * 60 * 1000,
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
			<div className='controls'>
				<input
					className='input controls__month'
					aria-label='Month'
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
				<div className='btn-row'>
					<button
						className='btn btn--primary'
						onClick={() => setState('Add')}
						disabled={
							!argDate ||
							currentEntries.some(
								(entry) => entry.year === argDate?.year && entry.month === argDate?.month
							)
						}
					>
						Add
					</button>
					<button
						className='btn btn--secondary'
						onClick={() => setState('Edit')}
						disabled={
							!argDate ||
							!currentEntries.some(
								(entry) => entry.year === argDate?.year && entry.month === argDate?.month
							)
						}
					>
						Edit
					</button>
					<button
						className='btn btn--danger-ghost'
						onClick={() => setState('Delete')}
						disabled={
							!argDate ||
							!currentEntries.some(
								(entry) => entry.year === argDate?.year && entry.month === argDate?.month
							)
						}
					>
						Delete
					</button>
				</div>
			</div>
		);
	};

	const renderDelete = () => {
		if (!currentEntries) {
			throw Error('ERROR STATE: No current entries in renderDelete');
		}

		return (
			<div className='confirm'>
				<p className='confirm__text'>
					Permanently delete the entry for {argDate?.month}/{argDate?.year}? This can't be undone.
				</p>
				<div className='btn-row'>
					<button
						className='btn btn--secondary'
						onClick={() => setState('Closed')}
					>
						Cancel
					</button>
					<button
						className='btn btn--danger'
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
			</div>
		);
	};

	if (isLoading) {
		return (
			<div className='entries'>
				<p className='loading loading--fill'>Loading…</p>
			</div>
		);
	}

	if (!currentEntries) {
		return <p className='empty'>No entries found</p>;
	}

	return (
		<div className='entries'>
			{isRefetching || isPending ? (
				<p className='loading loading--fill'>Loading…</p>
			) : argDate ? (
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
			) : (
				renderClosed()
			)}
		</div>
	);
};
