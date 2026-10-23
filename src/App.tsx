import './App.css';
import { EntriesEditor } from './components/entries-editor';
import { Forecast } from './components/forecast';
import { ItemsClassifier } from './components/items-classifier';
import { Sheet } from './components/sheet';

export const App = () => {
	return (
		<div className='dashboard'>
			<section className='card card--wide'>
				<header className='card__header'>
					<h2 className='card__title'>Balance Sheet</h2>
					<p className='card__subtitle'>Your account balances month by month.</p>
				</header>
				<Sheet />
			</section>
			<section className='card'>
				<header className='card__header'>
					<h2 className='card__title'>Monthly Entries</h2>
					<p className='card__subtitle'>Pick a month to add, edit, or delete its balances.</p>
				</header>
				<EntriesEditor />
			</section>
			<section className='card'>
				<header className='card__header'>
					<h2 className='card__title'>Account Types</h2>
					<p className='card__subtitle'>Classify each account to power the breakdown.</p>
				</header>
				<ItemsClassifier />
			</section>
			<section className='card card--wide'>
				<header className='card__header'>
					<h2 className='card__title'>Forecast</h2>
					<p className='card__subtitle'>Describe your plan and let an LLM project your balances forward.</p>
				</header>
				<Forecast />
			</section>
		</div>
	);
};
