import { GetObjectCommand, PutObjectCommand, S3Client, type GetObjectCommandOutput } from '@aws-sdk/client-s3';
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

export const fetchEntries = async (s3: S3Client, userId: string): Promise<Entries> => {
	// await new Promise((resolve) => setTimeout(resolve, 5000));
	try {
		const res: GetObjectCommandOutput = await s3.send(
			new GetObjectCommand({ Bucket: 'wealth-forecast', Key: `${userId}/entries.json` })
		);
		const resString: string = (await res.Body?.transformToString()) || '';
		if (!resString) {
			return [];
		}
		return JSON.parse(resString)?.entries;
	} catch (err) {
		if ((err as any).Code === 'NoSuchKey') {
			return [];
		}

		console.error('Error fetching entries', err);
		throw err;
	}
};

export const updateEntries = async (s3: S3Client, userId: string, updatedEntries: Entries): Promise<void> => {
	// await new Promise((resolve) => setTimeout(resolve, 5000));s
	try {
		await s3.send(
			new PutObjectCommand({
				Bucket: 'wealth-forecast',
				Key: `${userId}/entries.json`,
				Body: JSON.stringify({ entries: updatedEntries }),
				ContentType: 'application/json',
			})
		);
	} catch (err) {
		alert('Error updating entries');
		console.error('Error updating entries', err);
		throw err;
	}
};
