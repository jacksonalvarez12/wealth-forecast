import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { fetchEntries, fetchForecastData } from '../api/s3';
import { useAppContext } from '../context/hook';

export const Forecast = () => {
	const { user, s3, bedrockRuntime } = useAppContext();

	const { data: entries } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
	});

	const {
		data: forecastData,
		isLoading,
		isRefetching,
	} = useQuery({
		queryKey: ['forecast'],
		queryFn: () => fetchForecastData(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
	});

	const [prompt, setPrompt] = useState<string>('');
	const [endDate, setEndDate] = useState<{ month: number; year: number } | null>(null);

	useEffect(() => {
		if (forecastData) {
			setPrompt(forecastData.prompt);
			setEndDate(forecastData.endDate);
		}
	}, [forecastData]);

	const runForecast = () => {
		if (!prompt || prompt === forecastData?.prompt || !endDate) {
			return;
		}

		// Make sure end date is after last entry
		if (!entries?.length) {
			alert('You need to add your first account balances before you can generate a forecast');
			return;
		}

		if (
			endDate.year < entries[entries.length - 1].year ||
			(endDate.year === entries[entries.length - 1].year && endDate.month <= entries[entries.length - 1].month)
		) {
			alert('Forecast end date must be after your latest entry');
			return;
		}
	};

	return (
		<div>
			{isLoading || isRefetching || !entries ? (
				<p>Loading...</p>
			) : !forecastData ? (
				<p>No forecast data</p>
			) : (
				<div>
					<label htmlFor='prompt'>
						<p>
							<strong>Construct your forecast prompt. </strong>An LLM will write code to generate your
							financial forecast.
						</p>
						<p>Give the following information:</p>
						<ul>
							<li>How much money is moving between which accounts and when</li>
							<li>Interest rates</li>
							<li>Expected rates of return</li>
							<li>What to do with money once a debt is paid off</li>
							<li>Etc.</li>
						</ul>
					</label>
					<textarea
						name='prompt'
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						placeholder='Enter your prompt'
					/>
					<label htmlFor='endDate'>Forecast End Date</label>
					<input
						name='endDate'
						type={'month'}
						onChange={(e) => {
							if (e.target.value === '') {
								setEndDate(null);
								return;
							}

							const month: number = parseInt(e.target.value.split('-')[1]);
							const year: number = parseInt(e.target.value.split('-')[0]);
							setEndDate({ month, year });
						}}
						value={
							endDate ? `${endDate.year}-${endDate.month < 10 ? `0${endDate.month}` : endDate.month}` : ''
						}
					/>
					<button
						type='submit'
						onClick={runForecast}
						disabled={!prompt || prompt === forecastData.prompt || !endDate}
					>
						Run Forecast
					</button>
				</div>
			)}
		</div>
	);
};
