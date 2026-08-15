import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';

interface TelegramUpdate {
	update_id: number;
	message?: { [key: string]: unknown };
	callback_query?: { [key: string]: unknown };
}

export class BaleEitaaTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bale / Eitaa Trigger',
		name: 'baleEitaaTrigger',
		icon: 'file:baleeitaa.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["eventFilter"]}}',
		description: 'Starts a workflow when new messages arrive in Bale or Eitaa (Long-polling)',
		defaults: {
			name: 'Bale / Eitaa Trigger',
		},
		polling: true,
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'baleEitaaBot',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event Filter',
				name: 'eventFilter',
				type: 'options',
				options: [
					{ name: 'All Events', value: 'all' },
					{ name: 'Messages Only', value: 'message' },
					{ name: 'Callback Queries Only', value: 'callback' },
				],
				default: 'all',
				description: 'Which bot events should trigger the workflow',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const credentials = await this.getCredentials('baleEitaaBot');
		const token = credentials.botToken as string;
		const platform = credentials.platform as string;

		// Telegram-compatible base URLs for Iranian messengers
		const baseUrl =
			platform === 'eitaa'
				? `https://eitaayar.ir/api/${token}`
				: `https://tapi.bale.ai/bot${token}`;

		// Persistent state: remember the last processed update id between polls
		const staticData = this.getWorkflowStaticData('node');
		const lastUpdateId = (staticData.lastUpdateId as number) || 0;

		const eventFilter = this.getNodeParameter('eventFilter', 0) as string;

		try {
			const response = await this.helpers.httpRequest({
				method: 'POST',
				url: `${baseUrl}/getUpdates`,
				body: {
					offset: lastUpdateId + 1,
					timeout: 25, // Long-polling hold time (seconds)
					allowed_updates: ['message', 'callback_query'],
				},
				json: true,
			});

			if (!response || !Array.isArray(response.result) || response.result.length === 0) {
				return null;
			}

			const updates = response.result as TelegramUpdate[];

			// Advance the offset so we never process the same update twice
			const maxId = Math.max(...updates.map((u) => u.update_id));
			staticData.lastUpdateId = maxId;

			// Apply the event filter
			const items: INodeExecutionData[] = [];
			for (const update of updates) {
				if (eventFilter === 'message' && !update.message) continue;
				if (eventFilter === 'callback' && !update.callback_query) continue;

				items.push({
					json: {
						updateId: update.update_id,
						eventType: update.message ? 'message' : 'callback_query',
						chatId: (update.message?.chat as { id?: number })?.id ??
							(update.callback_query?.message as { chat?: { id?: number } })?.chat?.id ?? null,
						text: (update.message as { text?: string })?.text ??
							(update.callback_query as { data?: string })?.data ?? '',
						raw: update,
					},
				});
			}

			return items.length > 0 ? [items] : null;
		} catch (error) {
			// Long-polling timeouts and connection resets are EXPECTED; do not fail the workflow
			const err = error as { code?: string; statusCode?: number; message?: string };
			if (
				err.code === 'ETIMEDOUT' ||
				err.code === 'ECONNRESET' ||
				err.code === 'ECONNABORTED' ||
				err.statusCode === 409
			) {
				return null;
			}
			throw error;
		}
	}
}
