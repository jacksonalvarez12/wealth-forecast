import { Authenticator } from '@aws-amplify/ui-react';
import { App } from './App';
import { AppProvider } from './context/provider';
import { ThemeToggle } from './theme';

const Brand = () => (
	<div className='brand'>
		<span className='brand__mark' aria-hidden='true'>
			<svg
				width='18'
				height='18'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='2.25'
				strokeLinecap='round'
				strokeLinejoin='round'
			>
				<path d='M3 17l6-6 4 4 8-8' />
				<path d='M14 7h7v7' />
			</svg>
		</span>
		<h1 className='brand__name'>Wealth Forecast</h1>
	</div>
);

const authComponents = {
	Header: () => (
		<div className='auth-header'>
			<Brand />
			<ThemeToggle />
		</div>
	),
};

export const Auth = () => {
	return (
		<Authenticator hideSignUp components={authComponents}>
			{({ signOut, user }) => (
				<div className='app'>
					<header className='topbar'>
						<div className='topbar__inner'>
							<Brand />
							<div className='topbar__actions'>
								<p className='topbar__user'>
									<span className='topbar__user-label'>Signed in as </span>
									{user?.signInDetails?.loginId}
								</p>
								<ThemeToggle />
								<button className='btn btn--secondary btn--sm' onClick={signOut}>
									Sign out
								</button>
							</div>
						</div>
					</header>
					<main className='container'>
						<AppProvider user={user}>
							<App />
						</AppProvider>
					</main>
				</div>
			)}
		</Authenticator>
	);
};
