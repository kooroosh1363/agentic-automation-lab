import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GithubApi implements ICredentialType {
	name = 'githubApi';

	displayName = 'GitHub API';

	documentationUrl = 'https://docs.github.com/rest';

	properties: INodeProperties[] = [
		{
			displayName: 'Personal Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'GitHub PAT with required scopes',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.github.com',
			description: 'Override for GitHub Enterprise Server',
		},
	];
}