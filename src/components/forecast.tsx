import { useQuery } from '@tanstack/react-query';
import { fetchEntries } from '../api/s3';
import { useAppContext } from '../context/hook';

export const Forecast = () => {
	const { user, s3 } = useAppContext();

	const { data: entries } = useQuery({
		queryKey: ['entries'],
		queryFn: () => fetchEntries(s3, user.userId),
		enabled: !!user?.userId,
		retry: 1,
	});

	if (!entries) {
		return null;
	}

	return <div></div>;
};
