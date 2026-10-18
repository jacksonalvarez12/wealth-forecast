import './App.css';
import { EntriesEditor } from './components/entries-editor';
import { Forecast } from './components/forecast';
import { Sheet } from './components/sheet';

export const App = () => {
	return (
		<div>
			<Sheet />
			<EntriesEditor />
			<Forecast />
		</div>
	);
};
