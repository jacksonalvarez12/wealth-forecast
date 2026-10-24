import {
	InvokeModelCommand,
	type BedrockRuntimeClient,
	type InvokeModelCommandInput,
	type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { FORECAST_SYSTEM_PROMPT } from '../logic/forecast-prompt';
import type { Entries } from '../types/entries';

const FORECAST_WORKER_SOURCE = `
	// Remove obvious escape hatches (best-effort, not a true sandbox)
	self.fetch = undefined;
	self.XMLHttpRequest = undefined;
	self.WebSocket = undefined;
	self.importScripts = undefined;

	self.onmessage = (e) => {
		try {
			const { code, currentEntries, endDate } = e.data;

			// Indirect eval runs in global scope; the trailing expression returns the function
			const stepFunction = (0, eval)(
				code + "\\n;typeof stepFunction === 'function' ? stepFunction : undefined"
			);
			if (typeof stepFunction !== 'function') {
				throw new Error('Generated code did not define a stepFunction');
			}

			const entries = currentEntries.slice();
			let month = entries[entries.length - 1].month;
			let year = entries[entries.length - 1].year;

			while (true) {
				month++;
				if (month > 12) {
					month = 1;
					year++;
				}
				if (year > endDate.year || (year === endDate.year && month > endDate.month)) {
					break;
				}

				const items = stepFunction(entries);

				Object.keys(items).forEach(key => {
					if ((typeof items[key] !== 'number' && !items[key]) || isNaN(items[key])) {
						delete items[key];
					}
				});


				entries.push({ items, month, year });
			}

			self.postMessage({ ok: true, result: entries });
		} catch (err) {
			self.postMessage({ ok: false, error: String((err && err.stack) || err) });
		}
	};
`;

const runCode = (
	code: string,
	currentEntries: Entries,
	endDate: { month: number; year: number },
	timeoutMs = 5000
): Promise<Entries> => {
	const url = URL.createObjectURL(new Blob([FORECAST_WORKER_SOURCE], { type: 'text/javascript' }));
	const worker = new Worker(url);

	return new Promise<Entries>((resolve, reject) => {
		const cleanup = () => {
			clearTimeout(timer);
			worker.terminate();
			URL.revokeObjectURL(url);
		};

		const timer = setTimeout(() => {
			cleanup();
			reject(new Error(`stepFunction timed out after ${timeoutMs}ms`));
		}, timeoutMs);

		worker.onmessage = (e: MessageEvent<{ ok: boolean; result?: Entries; error?: string }>) => {
			cleanup();
			if (e.data.ok) {
				resolve(e.data.result as Entries);
			} else {
				reject(new Error(e.data.error));
			}
		};

		worker.onerror = (e) => {
			cleanup();
			reject(new Error(e.message));
		};

		worker.postMessage({ code, currentEntries, endDate });
	});
};

export const runForecast = async (
	bedrockRuntime: BedrockRuntimeClient,
	prompt: string,
	currentEntries: Entries,
	endDate: { month: number; year: number }
): Promise<{ entriesWithForecast: Entries; code: string }> => {
	const body = {
		anthropic_version: 'bedrock-2023-05-31',
		system: FORECAST_SYSTEM_PROMPT,
		max_tokens: 64000,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: `End Date: ${endDate.month}/${endDate.year}\n\nCurrent Entries: ${JSON.stringify(currentEntries, null, 2)}\n\nPrompt: ${prompt}`,
					},
				],
			},
		],
	};

	const input: InvokeModelCommandInput = {
		modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
		// modelId: 'us.anthropic.claude-haiku-5-5',
		guardrailIdentifier: 'f5mcgod7diqm',
		guardrailVersion: '1',
		contentType: 'application/json',
		accept: 'application/json',
		body: JSON.stringify(body),
	};

	const response: InvokeModelCommandOutput = await bedrockRuntime.send(new InvokeModelCommand(input));

	// response.body is a Uint8Array
	const decoded = JSON.parse(new TextDecoder().decode(response.body));

	// Concatenate all text blocks into one string
	let code: string = decoded.content
		.filter((block: { type: string }) => block.type === 'text')
		.map((block: { text: string }) => block.text)
		.join('');

	code = code.replace('```javascript', '').replace('```js', '').replaceAll('```', '');

	const entriesWithForecast: Entries = await runCode(code, currentEntries, endDate);

	return { entriesWithForecast, code };
};
