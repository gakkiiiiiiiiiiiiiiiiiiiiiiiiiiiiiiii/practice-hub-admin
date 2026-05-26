export interface ColumnPreferenceItem {
	key: string;
	visible: boolean;
	order: number;
}

export interface TableColumnLike {
	key?: string;
	dataIndex?: string | number | readonly (string | number)[];
	title?: unknown;
	fixed?: 'left' | 'right' | boolean;
	[key: string]: unknown;
}

const STORAGE_PREFIX = 'admin-table-columns:';

export function resolveColumnKey(column: TableColumnLike): string {
	if (column.key != null && column.key !== '') {
		return String(column.key);
	}
	if (Array.isArray(column.dataIndex)) {
		return column.dataIndex.join('.');
	}
	if (column.dataIndex != null && column.dataIndex !== '') {
		return String(column.dataIndex);
	}
	return '';
}

export function resolveColumnTitle(column: TableColumnLike, fallbackKey: string): string {
	if (typeof column.title === 'string' && column.title.trim()) {
		return column.title.trim();
	}
	return fallbackKey;
}

export function loadColumnPreference(storageKey: string): ColumnPreferenceItem[] | null {
	try {
		const raw = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed
			.filter((item) => item && item.key)
			.map((item, index) => ({
				key: String(item.key),
				visible: item.visible !== false,
				order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
			}));
	} catch {
		return null;
	}
}

export function saveColumnPreference(storageKey: string, items: ColumnPreferenceItem[]) {
	localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(items));
}

export function isLockedColumn(
	column: TableColumnLike,
	options?: {
		lockLeftKeys?: string[];
		lockRightKeys?: string[];
		lockKeys?: string[];
	},
) {
	const key = resolveColumnKey(column);
	const lockLeftKeys = new Set(options?.lockLeftKeys || []);
	const lockRightKeys = new Set(options?.lockRightKeys || []);
	const lockKeys = new Set(options?.lockKeys || []);
	if (!key) return true;
	if (column.fixed === 'left' || lockLeftKeys.has(key)) return true;
	if (column.fixed === 'right' || lockRightKeys.has(key)) return true;
	return lockKeys.has(key);
}

export function getConfigurableColumns(
	columns: TableColumnLike[],
	options?: {
		lockLeftKeys?: string[];
		lockRightKeys?: string[];
		lockKeys?: string[];
	},
) {
	return columns.filter((column) => !isLockedColumn(column, options));
}

export function buildDefaultColumnPreference(
	columns: TableColumnLike[],
	options?: {
		lockLeftKeys?: string[];
		lockRightKeys?: string[];
		lockKeys?: string[];
	},
): ColumnPreferenceItem[] {
	return getConfigurableColumns(columns, options).map((column, index) => ({
		key: resolveColumnKey(column),
		visible: true,
		order: index,
	}));
}

export function mergeColumnPreference(
	columns: TableColumnLike[],
	saved: ColumnPreferenceItem[] | null,
	options?: {
		lockLeftKeys?: string[];
		lockRightKeys?: string[];
		lockKeys?: string[];
	},
): ColumnPreferenceItem[] {
	const configurable = getConfigurableColumns(columns, options);
	const defaultPreference = buildDefaultColumnPreference(columns, options);
	if (!configurable.length) return [];
	if (!saved?.length) return defaultPreference;

	const validKeys = new Set(configurable.map((column) => resolveColumnKey(column)));
	const savedMap = new Map(
		saved.filter((item) => validKeys.has(item.key)).map((item) => [item.key, item]),
	);

	let maxOrder = saved.reduce((max, item) => Math.max(max, item.order ?? 0), -1);
	const merged: ColumnPreferenceItem[] = configurable.map((column) => {
		const key = resolveColumnKey(column);
		const existing = savedMap.get(key);
		if (existing) {
			return {
				key,
				visible: existing.visible !== false,
				order: existing.order ?? 0,
			};
		}
		maxOrder += 1;
		return {
			key,
			visible: true,
			order: maxOrder,
		};
	});

	return merged
		.sort((a, b) => a.order - b.order)
		.map((item, index) => ({
			...item,
			order: index,
		}));
}

export function applyColumnPreference(
	columns: TableColumnLike[],
	preference: ColumnPreferenceItem[],
	options?: {
		lockLeftKeys?: string[];
		lockRightKeys?: string[];
		lockKeys?: string[];
	},
) {
	const prefMap = new Map(preference.map((item) => [item.key, item]));
	const leftFixed: TableColumnLike[] = [];
	const rightFixed: TableColumnLike[] = [];
	const middle: TableColumnLike[] = [];
	const lockLeftKeys = new Set(options?.lockLeftKeys || []);
	const lockRightKeys = new Set(options?.lockRightKeys || []);
	const lockKeys = new Set(options?.lockKeys || []);

	columns.forEach((column) => {
		const key = resolveColumnKey(column);
		if (column.fixed === 'left' || lockLeftKeys.has(key)) {
			leftFixed.push(column);
			return;
		}
		if (column.fixed === 'right' || lockRightKeys.has(key)) {
			rightFixed.push(column);
			return;
		}
		if (lockKeys.has(key)) {
			rightFixed.push(column);
			return;
		}
		middle.push(column);
	});

	const sortedMiddle = [...middle].sort((a, b) => {
		const orderA = prefMap.get(resolveColumnKey(a))?.order ?? 999;
		const orderB = prefMap.get(resolveColumnKey(b))?.order ?? 999;
		return orderA - orderB;
	});

	const visibleMiddle = sortedMiddle.filter((column) => {
		const pref = prefMap.get(resolveColumnKey(column));
		return pref?.visible !== false;
	});

	return [...leftFixed, ...visibleMiddle, ...rightFixed];
}
