import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEntries, updateEntries } from './api/s3';
import './App.css';
import { EntriesEditor } from './components/entries-editor';
import { Sheet } from './components/sheet';
import { useAppContext } from './context/hook';
import type { Entries } from './types/user-data';

export const App = () => {
	const { user, s3 } = useAppContext();

	const queryClient = useQueryClient();

	const { data: entries, isLoading } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
	});
	const { mutate } = useMutation({
		mutationFn: async ({ entries }: { entries: Entries }) => updateEntries(s3, user.userId, entries),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['entries'] });
		},
		retry: 1,
	});

	if (!entries && isLoading) {
		return <p>Entries loading</p>;
	} else if (!entries) {
		return <p>Entries fetch failed</p>;
	}

	return (
		<div>
			<h2>Sheet</h2>
			<Sheet entries={entries} />
			<EntriesEditor
				currentEntries={entries}
				setEntries={(entries: Entries) => {
					mutate({ entries });
				}}
			/>
		</div>
	);
};
