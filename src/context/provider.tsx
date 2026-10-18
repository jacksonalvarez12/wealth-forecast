import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';
import { fetchAuthSession, type AuthUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { AppContext } from './context';

export const AppProvider = (opts: { user: AuthUser | undefined; children: React.ReactNode }) => {
	const { user, children } = opts;

	const [s3, setS3] = useState<S3Client | undefined>(undefined);
	const [bedrockRuntime, setBedrockRuntime] = useState<BedrockRuntimeClient | undefined>(undefined);

	useEffect(() => {
		// Resolve credentials lazily so the SDK picks up refreshed Identity Pool creds after expiry
		const credentials = async () => {
			const { credentials } = await fetchAuthSession();
			if (!credentials) {
				throw new Error('No AWS credentials from Amplify?');
			}
			return credentials;
		};
		setS3(new S3Client({ region: 'us-east-1', credentials }));
		setBedrockRuntime(new BedrockRuntimeClient({ region: 'us-east-1', credentials }));
	}, [user?.userId]);

	if (!user?.userId) {
		return <p>User or User ID is undefined</p>;
	}

	if (!s3 || !bedrockRuntime) {
		return <p>Context Loading</p>;
	}

	return <AppContext.Provider value={{ user, s3, bedrockRuntime }}>{children}</AppContext.Provider>;
};
