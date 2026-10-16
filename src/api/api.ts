import type { Data } from '../types/types';

const data: Data = {
	entries: [
		{
			month: 1,
			year: 2026,
			items: [
				{
					'401k': 1000,
					'Auto Loan': -5000,
					HYSA: 10000,
				},
			],
		},
		{
			month: 2,
			year: 2026,
			items: [
				{
					'401k': 1500,
					'Auto Loan': -4500,
					HYSA: 7000,
				},
			],
		},
	],
};

export const fetchData = async (): Promise<Data> => {
	return Promise.resolve(data);
};

export const updateData = async (
	newEntry: Data['entries'][0] = {
		month: 3,
		year: 2026,
		items: [
			{
				'401k': 2000,
				'Auto Loan': -4000,
				HYSA: 12000,
			},
		],
	}
): Promise<void> => {
	data.entries.push(newEntry);
	return Promise.resolve();
};
