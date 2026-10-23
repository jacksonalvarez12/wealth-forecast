import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchEntries, fetchItemClassifications, updateItemClassifications } from '../api/s3';
import { useAppContext } from '../context/hook';
import type { Entries, ItemClassifications } from '../types/entries';

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
			<div>
				{itemClassifications && (
					<div>
						{itemClassifications.map((c, index) => {
							return (
								<div key={index}>
									<p>{`${c.itemName}: ${c.classification || 'No Classification'}`}</p>
								</div>
							);
						})}
					</div>
				)}
				<button
					disabled={isLoading || isRefetching || isPending}
					onClick={() => setState('Edit')}
				>
					Edit
				</button>
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
			<div>
				{Array.from(itemNames).map((itemName, index) => {
					return (
						<div key={index}>
							<p>{itemName}</p>
							<select
								value={
									edittingClassifications.find((c) => c.itemName === itemName)?.classification || ''
								}
								onChange={(e) => {
									const newClassifications: ItemClassifications = edittingClassifications.map((c) => {
										if (c.itemName === itemName) {
											return { ...c, classification: e.target.value };
										}
										return c;
									}) as ItemClassifications;
									calcAndSetEdittingClassifications(entries, newClassifications);
								}}
							>
								<option value=''></option>
								<option value='Debt'>Debt</option>
								<option value='Illiquid Asset'>Illiquid Asset</option>
								<option value='Liquid Asset'>Liquid Asset</option>
							</select>
						</div>
					);
				})}
				<button
					disabled={isPending || isRefetching || isLoading}
					onClick={() => {
						setClassifications(edittingClassifications);
						setState('Closed');
					}}
				>
					Save
				</button>
				<button
					onClick={() => {
						setState('Closed');
						calcAndSetEdittingClassifications(entries, itemClassifications);
					}}
				>
					Cancel
				</button>
			</div>
		);
	};

	return (
		<div>
			{!entries || isLoading ? (
				<p>Loading...</p>
			) : (
				{
					Closed: renderClosed(),
					Edit: renderEdit(),
				}[state]
			)}
		</div>
	);
};
