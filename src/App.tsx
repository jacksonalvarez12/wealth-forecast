import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, updateData } from './api/api';
import './App.css';
import { Sheet } from './components/sheet';

export const App = () => {
	const queryClient = useQueryClient();

	const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });
	const { mutate } = useMutation({
		mutationFn: updateData,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['data'] });
		},
	});

	return (
		<div>
			<h1>wealth-forecast</h1>
			{!data ? (
				<p>Data loading</p>
			) : (
				<>
					<button onClick={() => mutate()}>Update Data</button>
					<h2>Sheet</h2>
					<Sheet entries={data.entries} />
				</>
			)}
		</div>
	);
};
