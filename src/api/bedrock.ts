import {
	InvokeModelCommand,
	type BedrockRuntimeClient,
	type InvokeModelCommandInput,
	type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { FORECAST_SYSTEM_PROMPT } from '../logic/forecast-prompt';
import type { Entries } from '../types/entries';

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

	code = code.replace('```javascript', '').replaceAll('```', '');

	return { entriesWithForecast: currentEntries, code };
};
