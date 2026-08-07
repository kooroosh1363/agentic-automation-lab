import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ZarinpalApi implements ICredentialType {
	name = 'zarinpalApi';

	displayName = 'Zarinpal API';

	documentationUrl = 'https://docs.zarinpal.com/';

	properties: INodeProperties[] = [
		{
			displayName: 'Merchant ID',
			name: 'merchantId',
			type: 'string',
			default: '',
			placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
			description: 'Your Zarinpal Merchant ID in UUID format',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Sandbox (Zarin-Gate)', value: 'sandbox' },
			],
			default: 'production',
			description: 'Choose sandbox for testing without real money',
		},
	];
}