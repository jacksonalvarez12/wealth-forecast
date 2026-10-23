import { GetObjectCommand, PutObjectCommand, S3Client, type GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { cleanEntries } from '../logic/utils';
import type { Entries, ItemClassifications } from '../types/entries';
import type { ForecastData } from '../types/forecast';

export const API_DELAY = 300;

export const fetchEntries = async (s3: S3Client, userId: string): Promise<Entries> => {
	API_DELAY > 0 && (await new Promise((resolve) => setTimeout(resolve, API_DELAY)));
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
	API_DELAY > 0 && (await new Promise((resolve) => setTimeout(resolve, API_DELAY)));
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

export const fetchItemClassifications = async (s3: S3Client, userId: string): Promise<ItemClassifications> => {
	API_DELAY > 0 && (await new Promise((resolve) => setTimeout(resolve, API_DELAY)));
	try {
		const res: GetObjectCommandOutput = await s3.send(
			new GetObjectCommand({ Bucket: 'wealth-forecast', Key: `${userId}/classifications.json` })
		);
		const resString: string = (await res.Body?.transformToString()) || '';
		if (!resString) {
			return [];
		}
		return JSON.parse(resString)?.classifications;
	} catch (err) {
		if ((err as any).Code === 'NoSuchKey') {
			return [];
		}

		console.error('Error fetching classifications', err);
		throw err;
	}
};

export const updateItemClassifications = async (
	s3: S3Client,
	userId: string,
	updatedItemClassifications: ItemClassifications
): Promise<void> => {
	API_DELAY > 0 && (await new Promise((resolve) => setTimeout(resolve, API_DELAY)));
	try {
		await s3.send(
			new PutObjectCommand({
				Bucket: 'wealth-forecast',
				Key: `${userId}/classifications.json`,
				Body: JSON.stringify({ classifications: updatedItemClassifications }),
				ContentType: 'application/json',
				CacheControl: 'no-cache', // Gets rid of need to refresh to see changes. Important!
			})
		);
	} catch (err) {
		alert('Error updating classifications');
		console.error('Error updating classifications', err);
		throw err;
	}
};

export const fetchForecastData = async (s3: S3Client, userId: string): Promise<ForecastData> => {
	const defaultForecastData: ForecastData = {
		prompt: '',
		entriesWithForecast: [],
		code: '',
		endDate: { month: 3, year: 2030 },
	};

	API_DELAY > 0 && (await new Promise((resolve) => setTimeout(resolve, API_DELAY)));
	try {
		const res: GetObjectCommandOutput = await s3.send(
			new GetObjectCommand({ Bucket: 'wealth-forecast', Key: `${userId}/forecast.json` })
		);
		const resString: string = (await res.Body?.transformToString()) || '';
		if (!resString) {
			return defaultForecastData;
		}
		return JSON.parse(resString);
	} catch (err) {
		if ((err as any).Code === 'NoSuchKey') {
			return defaultForecastData;
		}

		console.error('Error fetching forecast data', err);
		throw err;
	}
};

export const updateForecastData = async (
	s3: S3Client,
	userId: string,
	updatedForecastData: ForecastData
): Promise<void> => {
	API_DELAY > 0 && (await new Promise((resolve) => setTimeout(resolve, API_DELAY)));
	try {
		await s3.send(
			new PutObjectCommand({
				Bucket: 'wealth-forecast',
				Key: `${userId}/forecast.json`,
				Body: JSON.stringify(updatedForecastData),
				ContentType: 'application/json',
				CacheControl: 'no-cache', // Gets rid of need to refresh to see changes. Important!
			})
		);
	} catch (err) {
		alert('Error updating forecast data');
		console.error('Error updating forecast data', err);
		throw err;
	}
};
