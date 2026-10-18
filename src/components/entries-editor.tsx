import type { Entries } from '../types/user-data';

const entries: Entries = [
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

export const EntriesEditor = (opts: { currentEntries: Entries; setEntries: (entries: Entries) => void }) => {
	const { currentEntries, setEntries } = opts;

	return (
		<div>
			<h2>Entries</h2>
			<button onClick={() => setEntries(entries)}>Set Entries</button>
		</div>
	);
};
