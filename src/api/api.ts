import type { Data } from '../types/types';

const data: Data = {
	entries: [
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
	],
};

export const fetchData = async (): Promise<Data> => {
	// await new Promise((resolve) => setTimeout(resolve, 5000));
	return Promise.resolve(data);
};

export const updateData = async (
	newEntry: Data['entries'][0] = {
		month: 3,
		year: 2026,
		items: {
			'401k': 2000,
			HYSA: 12000,
			'Student Loans': -9000,
			'Roth IRA': 6000,
			'Roth 401k': 2500,
			'Down Payment': 100000,
		},
	}
): Promise<void> => {
	data.entries.push(newEntry);
	return Promise.resolve();
};
