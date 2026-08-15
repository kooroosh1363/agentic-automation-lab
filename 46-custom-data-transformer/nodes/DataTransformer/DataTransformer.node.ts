import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// ===== Recursive Algorithms =====

function flattenObject(obj: IDataObject, prefix = '', separator = '.'): IDataObject {
	const result: IDataObject = {};
	for (const [key, value] of Object.entries(obj)) {
		const newKey = prefix ? `${prefix}${separator}${key}` : key;
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			Object.assign(result, flattenObject(value as IDataObject, newKey, separator));
		} else {
			result[newKey] = value;
		}
	}
	return result;
}

function deepMerge(target: IDataObject, source: IDataObject): IDataObject {
	const output: IDataObject = { ...target };
	for (const [key, value] of Object.entries(source)) {
		const existing = output[key];
		if (
			value && typeof value === 'object' && !Array.isArray(value) &&
			existing && typeof existing === 'object' && !Array.isArray(existing)
		) {
			output[key] = deepMerge(existing as IDataObject, value as IDataObject);
		} else {
			output[key] = value;
		}
	}
	return output;
}

export class DataTransformer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Data Transformer',
		name: 'dataTransformer',
		icon: 'file:datatransformer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Advanced data transformation: flatten, deep merge, deduplicate, group by, select fields',
		defaults: {
			name: 'Data Transformer',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Flatten', value: 'flatten', description: 'Flatten nested JSON into dot-notation keys', action: 'Flatten nested JSON' },
					{ name: 'Deep Merge', value: 'deepMerge', description: 'Recursively merge all input items into one object', action: 'Deep merge objects' },
					{ name: 'Deduplicate', value: 'deduplicate', description: 'Remove duplicate items by a field', action: 'Deduplicate items' },
					{ name: 'Group By', value: 'groupBy', description: 'Group items by a field value', action: 'Group items' },
					{ name: 'Select Fields', value: 'selectFields', description: 'Keep or remove specific fields', action: 'Select fields' },
				],
				default: 'flatten',
			},
			{
				displayName: 'Separator',
				name: 'separator',
				type: 'string',
				default: '.',
				displayOptions: { show: { operation: ['flatten'] } },
				description: 'Separator used between nested keys',
			},
			{
				displayName: 'Field Name',
				name: 'fieldName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['deduplicate', 'groupBy'] } },
				description: 'The field used to detect duplicates or form groups',
			},
			{
				displayName: 'Fields (comma-separated)',
				name: 'fields',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['selectFields'] } },
				placeholder: 'id,name,email',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{ name: 'Keep Only', value: 'include' },
					{ name: 'Remove', value: 'exclude' },
				],
				default: 'include',
				displayOptions: { show: { operation: ['selectFields'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0) as string;
		const returnData: INodeExecutionData[] = [];

		if (operation === 'flatten') {
			const separator = this.getNodeParameter('separator', 0, '.') as string;
			for (const item of items) {
				returnData.push({ json: flattenObject(item.json, '', separator) });
			}
		}

		if (operation === 'deepMerge') {
			let merged: IDataObject = {};
			for (const item of items) {
				merged = deepMerge(merged, item.json);
			}
			returnData.push({ json: merged });
		}

		if (operation === 'deduplicate') {
			const fieldName = this.getNodeParameter('fieldName', 0) as string;
			const seen = new Set<unknown>();
			for (const item of items) {
				const value = (item.json as { [key: string]: unknown })[fieldName];
				if (value === undefined) {
					throw new NodeOperationError(this.getNode(), `Field "${fieldName}" not found in item.`);
				}
				const key = JSON.stringify(value);
				if (!seen.has(key)) {
					seen.add(key);
					returnData.push(item);
				}
			}
		}

		if (operation === 'groupBy') {
			const fieldName = this.getNodeParameter('fieldName', 0) as string;
			const groups: { [key: string]: INodeExecutionData[] } = {};
			for (const item of items) {
				const value = (item.json as { [key: string]: unknown })[fieldName];
				const key = String(value ?? 'null');
				if (!groups[key]) groups[key] = [];
				groups[key].push(item);
			}
			for (const [key, groupItems] of Object.entries(groups)) {
				returnData.push({
					json: {
						groupKey: key,
						count: groupItems.length,
						items: groupItems.map((g) => g.json),
					},
				});
			}
		}

		if (operation === 'selectFields') {
			const fieldsRaw = this.getNodeParameter('fields', 0) as string;
			const mode = this.getNodeParameter('mode', 0, 'include') as string;
			const fieldList = fieldsRaw.split(',').map((f) => f.trim()).filter((f) => f.length > 0);

			for (const item of items) {
			const source = item.json;
			const output: IDataObject = {};
				for (const [key, value] of Object.entries(source)) {
					const isInList = fieldList.includes(key);
					if ((mode === 'include' && isInList) || (mode === 'exclude' && !isInList)) {
						output[key] = value;
					}
				}
				returnData.push({ json: output });
			}
		}

		return [returnData];
	}
}
