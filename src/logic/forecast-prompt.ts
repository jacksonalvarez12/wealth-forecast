export const FORECAST_SYSTEM_PROMPT: string = `
Your job is to write some javascript code (JS not TS).

You will be given the following: a list of accounts/loans/investments that a user has, in the form of an array.
Each item in the array corresponds to a monthly snapshot of those items. For instance:

{"month":11,"year":2025,"items":{"401k":1000,"Auto Loan":-5000,"HYSA":10000,"Credit Card Debt":-500}

The above corresponds to November 2025, when the user had $1,000 in their 401k, $5,000 left on their auto loan, and etc.
You will also be given a date in the form of {"month":12,"year":2029}, which represents the last snapshot of the forecast.
Finally, you will be given a prompt from the user, in which they describe how much money is moving between their accounts and when,
the interest rates on their loans, the expected rates of returns, what extra money will go to once a loan is paid off, etc.

With all of this in mind, you job is to write JS code to complete the following function:

'''

const stepFunction = (previousEntries) => {

	const items = {};

	// LOGIC GOES HERE


	return {
		month: ...
		year: ...
		items: {...}
	}
}

'''

Where previousEntries has type {
    month: number;
    year: number;
    items: {
        [key: string]: number;
    };
}[]


Rules for your code:
- Pure function — no side effects, no require(), no fetch(), no process, no global state
- All arithmetic must be safe against division by zero — must never produce Infinity or NaN
- Plain JavaScript only — not TypeScript

Essentially, this function will be iteritavely called until the end date is reached. Don't worry, you don't need to keep track of the end date,
just ensure the function will work until the end date is reached.

Here's an example output:

\`\`\` javascript
const stepFunction = (previousEntries) => {

    annual_investments_rate = 0.09 // User provided rate of return
    monthly_investments_rate = 1.09 ** (1/12) - 1

    annual_car_interest_rate = 0.05
    monthly_car_interest_rate = 1.05 ** (1/12) - 1

	const items = {};

	const lastEntry = previousEntries[previousEntries.length - 1];

    items['401k'] = (lastEntry.items['401k'] * (1 + monthly_investments_rate)) + 1000;

    items['Auto Loan'] = (lastEntry.items['Auto Loan'] * (1 + monthly_car_interest_rate)) + 293;

    const newDate = {
        month: lastEntry.month + 1,
        year: lastEntry.year,
    };
    if (newDate.month > 12) {
        newDate.year += 1;
        newDate.month = 1;
    }


	return {
		month: newDate.month,
		year: newDate.year,
		items
	}
}
\`\`\`

Notice how I use readable code. This is because the end user will eventually read this code. Because of this, make sure to include
comments in your code, explaining what's happening.

Ok, that should be it. Make sure to output ONLY the function code, nothing else. Good luck!
`;

// import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
// import { VM } from 'vm2';
// import { invokeBedrock, parseLLMJson, parseLLMString } from '../shared/bedrock-client';
// import { getHistory, putHistory } from '../shared/s3-client';
// import { codeGenResponseSchema, financeStateSchema, simulateRequestSchema } from '../shared/schemas';
// import { CodeGenLLMResponse, FinanceState, SimulateRequest, SimulateResponse, SimulationEntry } from '../shared/types';

// // ------------------------------------------------------------------ prompts

// const CODE_GEN_SYSTEM_PROMPT = `You are a financial simulation engine. Given a user's financial profile, produce a JavaScript simulation.
// Respond ONLY with a JSON object in this exact shape:

// {
//   "initialFinanceState": {
//     "date": "YYYY-MM",
//     "values": { "bucketName": number }
//   },
//   "durationYears": number,
//   "durationMonths": number,
//   "simulationStepCode": "const simulationStep = (prev) => { ... return next; }"
// }

// Rules for simulationStep:
// - Pure function — no side effects, no require(), no fetch(), no process, no global state
// - Must return { date: string, values: { [bucket: string]: number } }
// - date must advance exactly one month in YYYY-MM format on each call
// - All arithmetic must be safe against division by zero — must never produce Infinity or NaN
// - Plain JavaScript only — not TypeScript

// Do not include markdown fences, preamble, or any text outside the JSON object.`;

// const REPORT_SYSTEM_PROMPT = `You are a financial advisor reviewing the results of a personal finance simulation.
// Write a clear plain-English report (400-800 words) covering:
// - Overall financial trajectory and net worth outlook
// - Notable milestones (home purchase, retirement, etc.) and whether they appear on track
// - Any months where finances look stressed or go negative
// - Specific comments on any goals or concerns the user mentioned

// Be direct and specific — reference actual months and figures from the simulation data where relevant.
// Use Markdown for formatting.`;

// // ------------------------------------------------------------------ helpers

// function ok(body: SimulateResponse): APIGatewayProxyResultV2 {
// 	return {
// 		statusCode: 200,
// 		headers: { 'Content-Type': 'application/json' },
// 		body: JSON.stringify(body),
// 	};
// }

// function err(statusCode: number, message: string): APIGatewayProxyResultV2 {
// 	return {
// 		statusCode,
// 		headers: { 'Content-Type': 'application/json' },
// 		body: JSON.stringify({ error: message }),
// 	};
// }

// function getSub(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
// 	return event.requestContext.authorizer.jwt.claims.sub as string;
// }

// // ------------------------------------------------------------------ sandbox

// function runSimulation(simulationStepCode: string, initialState: FinanceState, totalMonths: number): FinanceState[] {
// 	const vm = new VM({
// 		timeout: 2000,
// 		allowAsync: false,
// 		sandbox: {},
// 	});

// 	// Load the step function into the sandbox
// 	vm.run(simulationStepCode);

// 	const simulation: FinanceState[] = [initialState];
// 	let pointer = initialState;

// 	for (let i = 0; i < totalMonths; i++) {
// 		const raw = vm.run(`simulationStep(${JSON.stringify(pointer)})`);

// 		const { error, value } = financeStateSchema.validate(raw);
// 		if (error) {
// 			throw new Error(`Invalid FinanceState at month ${i + 1}: ${error.message}`);
// 		}

// 		simulation.push(value as FinanceState);
// 		pointer = value as FinanceState;
// 	}

// 	return simulation;
// }

// // ------------------------------------------------------------------ handler

// export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<APIGatewayProxyResultV2> => {
// 	const sub = getSub(event);

// 	try {
// 		// --- Validate request ---
// 		const body = JSON.parse(event.body ?? '{}');
// 		const { error, value } = simulateRequestSchema.validate(body);
// 		if (error) return err(400, error.message);

// 		const { approvedInput, simulationId } = value as SimulateRequest;

// 		// --- Step 1: Code generation ---
// 		const codeGenRaw = await invokeBedrock(CODE_GEN_SYSTEM_PROMPT, approvedInput, 8192);

// 		const codeGenParsed = parseLLMJson<CodeGenLLMResponse>(codeGenRaw);
// 		const { error: codeGenError, value: codeGenValue } = codeGenResponseSchema.validate(codeGenParsed);
// 		if (codeGenError) {
// 			throw new Error(`Code gen LLM returned invalid shape: ${codeGenError.message}`);
// 		}

// 		const { initialFinanceState, durationYears, durationMonths, simulationStepCode } = codeGenValue;

// 		const totalMonths = durationYears * 12 + durationMonths;

// 		// --- Step 2: Run simulation in sandbox ---
// 		const simulationData = runSimulation(simulationStepCode, initialFinanceState, totalMonths);

// 		// --- Step 3: Generate report ---
// 		const reportUserMessage = `
// User financial profile:
// ${approvedInput}

// Simulation duration: ${totalMonths} months (${durationYears} years, ${durationMonths} months)

// Simulation data (monthly snapshots):
// ${JSON.stringify(simulationData, null, 2)}
//     `.trim();

// 		const reportRaw = await invokeBedrock(REPORT_SYSTEM_PROMPT, reportUserMessage, 2048);
// 		const report: string = parseLLMString(reportRaw);

// 		// --- Step 4: Persist to S3 ---
// 		const entry: SimulationEntry = {
// 			id: simulationId, // from frontend, not generated here
// 			simulationName: `Simulation ${new Date().toLocaleDateString()}`,
// 			createdAt: new Date().toISOString(),
// 			input: approvedInput,
// 			simulationData,
// 			report,
// 			simulationStepCode,
// 		};

// 		const history = await getHistory(sub);
// 		const existingIndex = history.simulations.findIndex((s) => s.id === simulationId);

// 		if (existingIndex !== -1) {
// 			// Replace existing entry — user re-ran the same simulation
// 			history.simulations[existingIndex] = entry;
// 		} else {
// 			// First run for this simulation id
// 			history.simulations.push(entry);
// 		}

// 		await putHistory(sub, history);

// 		// --- Step 5: Return to client ---
// 		return ok({
// 			simulationData,
// 			report,
// 			simulationStepCode,
// 			durationMonths: totalMonths,
// 		});
// 	} catch (e: any) {
// 		console.error('simulation error:', e);
// 		return err(500, 'Simulation failed. Please try again.');
// 	}
// };
