import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class BaleEitaaBot implements ICredentialType {
	name = 'baleEitaaBot';

	displayName = 'Bale / Eitaa Bot';

	documentationUrl = 'https://docs.bale.ai/';

	properties: INodeProperties[] = [
		{
			displayName: 'Platform',
			name: 'platform',
			type: 'options',
			options: [
				{ name: 'Bale', value: 'bale' },
				{ name: 'Eitaa', value: 'eitaa' },
			],
			default: 'bale',
			description: 'Both platforms expose a Telegram-compatible Bot API',
		},
		{
			displayName: 'Bot Token',
			name: 'botToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: '123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
			description: 'Bot token from Bale BotFather or Eitaa bot management',
		},
	];
}