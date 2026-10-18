import type { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import type { S3Client } from '@aws-sdk/client-s3';
import type { AuthUser } from 'aws-amplify/auth';

export type AppContextType = {
	user: AuthUser;
	s3: S3Client;
	bedrockRuntime: BedrockRuntimeClient;
};
