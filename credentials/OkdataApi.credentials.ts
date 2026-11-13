import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OkdataApi implements ICredentialType {
	name = 'okdataApi';

	displayName = 'Okdata API';

	icon = {
		light: 'file:../nodes/Okdata/okdata.svg',
		dark: 'file:../nodes/Okdata/okdata.dark.svg',
	} as const;

	documentationUrl = 'https://github.com/okdataapi/n8n-nodes-okdata?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'okd_...',
			description:
				'Your okdata API key. Create one at https://okdata.online/signup/?src=n8n-node (new accounts get trial credit).',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// GET /v1/account is free: it checks the key and returns the balance, nothing is billed.
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.okdata.online',
			url: '/v1/account',
			headers: { 'X-Source': 'n8n' },
		},
	};
}
