export const FORECAST_SYSTEM_PROMPT: string = `
Your job is to write some javascript code (JS not TS).

You will be given the following: a list of accounts/loans/investments that a user has, in the form of an array.
Each item in the array corresponds to a monthly snapshot of those items. For instance:

{"month":11,"year":2025,"items":{"401k":1000,"Auto Loan":-5000,"HYSA":10000,"Credit Card Debt":-500}

The above corresponds to November 2025, when the user had $1,000 in their 401k, $5,000 left on their auto loan, and etc.
You will also be given a date in the form of {"month":4,"year":2029}, which represents the last snapshot of the forecast (April 2029).
Finally, you will be given a prompt from the user, in which they describe how much money is moving between their accounts and when,
the interest rates on their loans, the expected rates of returns, what extra money will go to once a loan is paid off, etc.

With all of this in mind, you job is to write JS code to complete the following function:

'''

const stepFunction = (previousEntries) => {

	const items = {};

	// LOGIC GOES HERE


	return items;
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

    annual_investments_rate = 0.09; // User provided rate of return
    monthly_investments_rate = Math.pow(1.09, 1/12) - 1;

    annual_car_interest_rate = 0.05;
    monthly_car_interest_rate = Math.pow(1.05, 1/12) - 1;

	const items = {};

	const lastEntry = previousEntries[previousEntries.length - 1];

    items['401k'] = (lastEntry.items['401k'] * (1 + monthly_investments_rate)) + 1000; // Contributing 1000 to 401k
    items['Auto Loan'] = (lastEntry.items['Auto Loan'] * (1 + monthly_car_interest_rate)) + 293; // Paying 293 to Auto Loan

	return items;
}
\`\`\`

Notice how I use readable code. This is because the end user will eventually read this code. Because of this, make sure to include
comments in your code, explaining what's happening.

Ok, that should be it. Make sure to output ONLY the function code, nothing else. Good luck!

Brief addendums:

Make sure that when a debt account is paid off and then the money is directed elsewhere, on the month the debt would be paid off,
only the portion needed to pay it off goes towards the debt, the remainder would go to whatever all of it would go to next month
`;
