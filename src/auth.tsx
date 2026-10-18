import { Authenticator } from '@aws-amplify/ui-react';
import { App } from './App';
import { AppProvider } from './context/provider';

export const Auth = () => {
	return (
		<Authenticator hideSignUp>
			{({ signOut, user }) => (
				<main>
					<h1>Wealth Forecast</h1>
					<div>
						<p>Signed in as {user?.signInDetails?.loginId}</p>
						<button onClick={signOut}>Sign out</button>
					</div>
					<AppProvider user={user}>
						<App />
					</AppProvider>
				</main>
			)}
		</Authenticator>
	);
};
