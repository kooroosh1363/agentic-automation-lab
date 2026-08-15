import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// ===== Resilience Helpers =====

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Exponential Backoff with Jitter to avoid Thundering Herd
function backoffDelay(attempt: number, baseMs = 1000, maxMs = 32000): number {
	const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
	const jitter = Math.random() * exponential * 0.5;
	return Math.floor(exponential + jitter);
}

export class GithubEnterprise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Enterprise',
		name: 'githubEnterprise',
		icon: 'file:github.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Enterprise GitHub client with auto-pagination and rate-limit backoff',
		defaults: { name: 'GitHub Enterprise' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'githubApi', required: true }],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'List Items', value: 'listItems', description: 'Fetch all pages automatically', action: 'List items with pagination' },
					{ name: 'Get Single Item', value: 'getItem', description: 'Fetch one resource by ID', action: 'Get a single item' },
				],
				default: 'listItems',
			},
			{
				displayName: 'Resource Path',
				name: 'resourcePath',
				type: 'string',
				default: '/repos/owner/repo/issues',
				required: true,
				placeholder: '/repos/owner/repo/issues',
				description: 'API endpoint path (without base URL)',
			},
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['getItem'] } },
			},
			{
				displayName: 'Pagination Strategy',
				name: 'paginationStrategy',
				type: 'options',
				options: [
					{ name: 'Offset (page number)', value: 'offset' },
					{ name: 'Cursor (next token)', value: 'cursor' },
				],
				default: 'offset',
				displayOptions: { show: { operation: ['listItems'] } },
			},
			{
				displayName: 'Data Field',
				name: 'dataField',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['listItems'] } },
				description: 'Field containing the array (leave empty if response is an array)',
			},
			{
				displayName: 'Cursor Field',
				name: 'cursorField',
				type: 'string',
				default: 'next_cursor',
				displayOptions: { show: { operation: ['listItems'], paginationStrategy: ['cursor'] } },
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				default: 100,
				displayOptions: { show: { operation: ['listItems'] } },
			},
			{
				displayName: 'Max Pages (safety limit)',
				name: 'maxPages',
				type: 'number',
				default: 10,
				displayOptions: { show: { operation: ['listItems'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('githubApi');
		const accessToken = credentials.accessToken as string;
		const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');

		const maxRetries = 5;
		const circuitBreakerThreshold = 3;

		const headers = {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github+json',
			'User-Agent': 'n8n-GithubEnterprise',
		};

		// Request with Exponential Backoff + Rate-Limit awareness
			const requestWithRetry = async (url: string, qs: IDataObject = {}): Promise<{ body: any; headers: any }> => {
			let attempt = 0;
			let consecutiveFailures = 0;

			while (true) {
				try {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url,
						qs,
						headers,
						json: true,
						returnFullResponse: true,
					});

					// Proactive rate-limit handling
					const remaining = response.headers?.['x-ratelimit-remaining'];
					if (remaining === '0') {
						const reset = parseInt(response.headers?.['x-ratelimit-reset'] || '0', 10);
						const waitMs = Math.min(60000, Math.max(0, reset * 1000 - Date.now()));
						if (waitMs > 0) await sleep(waitMs);
					}

					return { body: response.body, headers: response.headers };
				} catch (error) {
					const status = (error as { statusCode?: number }).statusCode || 0;
					const retryable = status === 429 || status >= 500;
					consecutiveFailures++;

					if (!retryable || attempt >= maxRetries || consecutiveFailures >= circuitBreakerThreshold) {
						throw error;
					}

					const retryAfter = (error as any).response?.headers?.['retry-after'];
					let delay = backoffDelay(attempt);
					if (retryAfter) delay = Math.max(delay, parseInt(retryAfter, 10) * 1000);
					await sleep(delay);
					attempt++;
				}
			}
		};

		const extractData = (body: any, dataField: string): any[] => {
			if (Array.isArray(body)) return body;
			if (dataField && body && Array.isArray(body[dataField])) return body[dataField];
			return [];
		};

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;
			const resourcePath = this.getNodeParameter('resourcePath', i) as string;

			try {
				if (operation === 'getItem') {
					const itemId = this.getNodeParameter('itemId', i) as string;
					const { body } = await requestWithRetry(`${baseUrl}${resourcePath}/${itemId}`);
					returnData.push({ json: body as IDataObject });
				}

				if (operation === 'listItems') {
					const strategy = this.getNodeParameter('paginationStrategy', i) as string;
					const dataField = this.getNodeParameter('dataField', i, '') as string;
					const cursorField = this.getNodeParameter('cursorField', i, 'next_cursor') as string;
					const pageSize = this.getNodeParameter('pageSize', i) as number;
					const maxPages = this.getNodeParameter('maxPages', i) as number;

					const allItems: any[] = [];

					if (strategy === 'offset') {
						let page = 1;
						while (page <= maxPages) {
							const { body } = await requestWithRetry(`${baseUrl}${resourcePath}`, { per_page: pageSize, page });
							const data = extractData(body, dataField);
							allItems.push(...data);
							if (data.length < pageSize) break;
							page++;
						}
					} else {
						let cursor: string | null = null;
						let pages = 0;
						do {
								const qs: IDataObject = { per_page: pageSize };
							if (cursor) qs.after = cursor;
							const { body } = await requestWithRetry(`${baseUrl}${resourcePath}`, qs);
							const data = extractData(body, dataField);
							allItems.push(...data);
							pages++;
							cursor = body && body[cursorField] ? String(body[cursorField]) : null;
						} while (cursor && pages < maxPages);
					}

					for (const item of allItems) {
						returnData.push({ json: item });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), (error as Error).message, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
