import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchEntries, fetchItemClassifications, updateItemClassifications } from '../api/s3';
import { useAppContext } from '../context/hook';
import type { Classification, Entries, ItemClassifications } from '../types/entries';

const badgeClassName = (classification?: Classification | '') => {
	switch (classification) {
		case 'Debt':
			return 'badge--debt';
		case 'Illiquid Asset':
			return 'badge--illiquid';
		case 'Liquid Asset':
			return 'badge--liquid';
		default:
			return 'badge--none';
	}
};

export const ItemsClassifier = () => {
	const { user, s3 } = useAppContext();

	const queryClient = useQueryClient();

	const { data: entries } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
		staleTime: 5 * 60 * 1000,
	});

	const {
		data: itemClassifications,
		isLoading,
		isRefetching,
	} = useQuery({
		queryKey: ['classifications'],
		queryFn: () => fetchItemClassifications(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
		staleTime: 5 * 60 * 1000,
	});
	const { mutate, isPending } = useMutation({
		mutationFn: async ({ classifications }: { classifications: ItemClassifications }) =>
			updateItemClassifications(s3, user.userId, classifications),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['classifications'] });
		},
		retry: 1,
	});

	const setClassifications = (classifications: ItemClassifications) => {
		mutate({ classifications });
	};

	const [state, setState] = useState<'Closed' | 'Edit'>('Closed');
	const [edittingClassifications, setEdittingClassifications] = useState<ItemClassifications | undefined>(undefined);

	const calcAndSetEdittingClassifications = (entriesObj: Entries, itemClassificationsObj: ItemClassifications) => {
		// Collect all unique item names
		const itemNames: Set<string> = new Set<string>();

		for (const entry of entriesObj) {
			for (const key of Object.keys(entry.items)) {
				itemNames.add(key);
			}
		}

		const newEdittingClassifications: ItemClassifications = [];

		for (const itemName of itemNames) {
			newEdittingClassifications.push({
				itemName,
				classification: itemClassificationsObj?.find((c) => c.itemName === itemName)?.classification || '',
			});
		}

		setEdittingClassifications(newEdittingClassifications);
	};

	useEffect(() => {
		if (!entries || !itemClassifications) return;

		calcAndSetEdittingClassifications(entries, itemClassifications);
	}, [entries, itemClassifications]);

	const renderClosed = () => {
		if (!entries) {
			throw Error('ERROR STATE: No entries in renderClosed itemClassifier');
		}

		return (
			<div className='classifier'>
				{itemClassifications && (
					<ul className='class-list'>
						{itemClassifications.map((c, index) => {
							return (
								<li key={index} className='class-list__item'>
									<span className='class-list__name'>{c.itemName}</span>
									<span className={`badge ${badgeClassName(c.classification)}`}>
										{c.classification || 'No Classification'}
									</span>
								</li>
							);
						})}
					</ul>
				)}
				{itemClassifications?.length === 0 && (
					<p className='empty'>Nothing classified yet. Click Edit to classify your accounts.</p>
				)}
				<div className='btn-row'>
					<button
						className='btn btn--secondary'
						disabled={isLoading || isRefetching || isPending}
						onClick={() => setState('Edit')}
					>
						Edit
					</button>
				</div>
			</div>
		);
	};

	const renderEdit = () => {
		if (!entries || !edittingClassifications || !itemClassifications) {
			return null;
		}

		// Collect all unique item names
		const itemNames: Set<string> = new Set<string>();

		for (const entry of entries) {
			for (const key of Object.keys(entry.items)) {
				itemNames.add(key);
			}
		}

		return (
			<div className='classifier'>
				<div className='class-edit'>
					{Array.from(itemNames).map((itemName, index) => {
						return (
							<label key={index} className='class-edit__row'>
								<span className='class-edit__name'>{itemName}</span>
								<select
									className='input'
									value={
										edittingClassifications.find((c) => c.itemName === itemName)?.classification ||
										''
									}
									onChange={(e) => {
										const newClassifications: ItemClassifications = edittingClassifications.map(
											(c) => {
												if (c.itemName === itemName) {
													return { ...c, classification: e.target.value };
												}
												return c;
											}
										) as ItemClassifications;
										calcAndSetEdittingClassifications(entries, newClassifications);
									}}
								>
									<option value=''></option>
									<option value='Debt'>Debt</option>
									<option value='Illiquid Asset'>Illiquid Asset</option>
									<option value='Liquid Asset'>Liquid Asset</option>
								</select>
							</label>
						);
					})}
				</div>
				<div className='btn-row'>
					<button
						className='btn btn--primary'
						disabled={isPending || isRefetching || isLoading}
						onClick={() => {
							setClassifications(edittingClassifications);
							setState('Closed');
						}}
					>
						Save
					</button>
					<button
						className='btn btn--ghost'
						onClick={() => {
							setState('Closed');
							calcAndSetEdittingClassifications(entries, itemClassifications);
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		);
	};

	return (
		<div>
			{!entries || isLoading ? (
				<p className='loading loading--classifier'>Loading…</p>
			) : (
				{
					Closed: renderClosed(),
					Edit: renderEdit(),
				}[state]
			)}
		</div>
	);
};
