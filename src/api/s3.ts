import { GetObjectCommand, PutObjectCommand, S3Client, type GetObjectCommandOutput } from '@aws-sdk/client-s3';
import type { Entries } from '../types/entries';
import { cleanEntries } from '../utils';

const API_DELAY = 2000;

export const fetchEntries = async (s3: S3Client, userId: string): Promise<Entries> => {
	await new Promise((resolve) => setTimeout(resolve, API_DELAY));
	try {
		const res: GetObjectCommandOutput = await s3.send(
			new GetObjectCommand({ Bucket: 'wealth-forecast', Key: `${userId}/entries.json` })
		);
		const resString: string = (await res.Body?.transformToString()) || '';
		if (!resString) {
			return [];
		}
		return cleanEntries(JSON.parse(resString)?.entries);
	} catch (err) {
		if ((err as any).Code === 'NoSuchKey') {
			return [];
		}

		console.error('Error fetching entries', err);
		throw err;
	}
};

export const updateEntries = async (s3: S3Client, userId: string, updatedEntries: Entries): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, API_DELAY));
	try {
		await s3.send(
			new PutObjectCommand({
				Bucket: 'wealth-forecast',
				Key: `${userId}/entries.json`,
				Body: JSON.stringify({ entries: cleanEntries(updatedEntries) }),
				ContentType: 'application/json',
				CacheControl: 'no-cache', // Gets rid of need to refresh to see changes. Important!
			})
		);
	} catch (err) {
		alert('Error updating entries');
		console.error('Error updating entries', err);
		throw err;
	}
};
