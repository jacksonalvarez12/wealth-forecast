import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchData, updateData } from './api/api';
import './App.css';

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
			{!data ? <p>Data loading</p> : <p>{JSON.stringify(data)}</p>}
			<button onClick={() => mutate()}>Update Data</button>
		</div>
	);
};
