import type { Data } from '../types/types';

export const fetchData = async (): Promise<Data> => {
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
	return Promise.resolve(data);
};
