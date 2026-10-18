import './App.css';
import { EntriesEditor } from './components/entries-editor';
import { Forecast } from './components/forecast';
import { Sheet } from './components/sheet';

export const App = () => {
	return (
		<div>
			<h2>Sheet</h2>
			<Sheet />
			<h2>Entries Editor</h2>
			<EntriesEditor />
			<h2>Forecast</h2>
			<Forecast />
		</div>
	);
};
