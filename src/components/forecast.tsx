import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { runForecast } from '../api/bedrock';
import { API_DELAY, fetchEntries, fetchForecastData, updateForecastData } from '../api/s3';
import { useAppContext } from '../context/hook';
import type { ForecastData } from '../types/forecast';
import { Sheet } from './sheet';

export const Forecast = () => {
	const { user, s3, bedrockRuntime } = useAppContext();

	const queryClient = useQueryClient();

	const { data: entries } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
		staleTime: 5 * 60 * 1000,
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
		staleTime: 5 * 60 * 1000,
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async ({ forecastData }: { forecastData: ForecastData }) =>
			updateForecastData(s3, user.userId, forecastData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['forecast'] });
		},
		retry: 1,
	});

	const setForecastData = (forecastData: ForecastData) => {
		mutate({ forecastData });
	};

	const [prompt, setPrompt] = useState<string>('');
	const [endDate, setEndDate] = useState<{ month: number; year: number } | null>(null);

	const [forecastRunning, setForecastRunning] = useState<boolean>(false);

	useEffect(() => {
		if (forecastData) {
			setPrompt(forecastData.prompt);
			setEndDate(forecastData.endDate);
		}
	}, [forecastData]);

	const onSubmit = async () => {
		if (
			!prompt ||
			(prompt === forecastData?.prompt &&
				endDate?.year === forecastData?.endDate.year &&
				endDate.month === forecastData?.endDate.month) ||
			!endDate ||
			forecastRunning
		) {
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

		setForecastRunning(true);

		const { entriesWithForecast, code } = await runForecast(bedrockRuntime, prompt, entries, endDate);

		setForecastData({
			prompt,
			entriesWithForecast,
			code,
			endDate,
		});

		setTimeout(() => setForecastRunning(false), 500 + API_DELAY);
	};

	return (
		<div>
			{isLoading || isRefetching || !entries ? (
				<p className='loading loading--forecast'>Loading…</p>
			) : !forecastData ? (
				<p className='empty'>No forecast data</p>
			) : (
				<div className='forecast'>
					<div className='forecast__form'>
						<label
							htmlFor='prompt'
							className='forecast__intro'
						>
							<p>
								<strong>Construct your forecast prompt. </strong>An LLM will write code to generate your
								financial forecast.
							</p>
							<p>Give the following information:</p>
							<ul className='forecast__list'>
								<li>How much money is moving between which accounts and when</li>
								<li>Interest rates</li>
								<li>Expected rates of return</li>
								<li>What to do with money once a debt is paid off</li>
								<li>Etc.</li>
							</ul>
						</label>
						<textarea
							id='prompt'
							className='input textarea'
							name='prompt'
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder='Enter your prompt'
						/>
						<div className='forecast__run'>
							<div className='field'>
								<label
									htmlFor='endDate'
									className='field__label'
								>
									Forecast End Date
								</label>
								<input
									id='endDate'
									className='input'
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
										endDate
											? `${endDate.year}-${endDate.month < 10 ? `0${endDate.month}` : endDate.month}`
											: ''
									}
								/>
							</div>
							<button
								type='submit'
								className='btn btn--primary'
								onClick={onSubmit}
								disabled={
									!prompt ||
									(prompt === forecastData.prompt &&
										endDate?.year === forecastData.endDate.year &&
										endDate.month === forecastData.endDate.month) ||
									!endDate ||
									forecastRunning
								}
							>
								Run Forecast
							</button>
						</div>
					</div>
					<div className='forecast__results'>
						{isPending || isRefetching || forecastRunning ? (
							<p className='loading loading--results'>Updating forecast…</p>
						) : forecastData.entriesWithForecast.length === 0 ? (
							<p className='empty empty--results'>
								No forecast yet. Write a prompt, pick an end date, and run it to see your projected
								balances and the generated code here.
							</p>
						) : (
							<>
								<h3 className='subheading'>Forecast Sheet</h3>
								<Sheet entriesParam={forecastData.entriesWithForecast}></Sheet>
								<h3 className='subheading'>Code</h3>
								<pre className='code'>
									<code className='language-javascript'>{forecastData.code}</code>
								</pre>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
