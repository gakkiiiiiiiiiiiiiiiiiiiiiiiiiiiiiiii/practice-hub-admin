import { computed, ref, unref, watch, type MaybeRef } from 'vue';
import {
	applyColumnPreference,
	buildDefaultColumnPreference,
	loadColumnPreference,
	mergeColumnPreference,
	resolveColumnKey,
	resolveColumnTitle,
	saveColumnPreference,
	type ColumnPreferenceItem,
	type TableColumnLike,
} from '@/utils/table-columns';

export interface UseTableColumnsOptions {
	lockLeftKeys?: string[];
	lockRightKeys?: string[];
	lockKeys?: string[];
}

export function useTableColumns(
	storageKey: string,
	sourceColumns: MaybeRef<TableColumnLike[]>,
	options: UseTableColumnsOptions = {},
) {
	const preference = ref<ColumnPreferenceItem[]>([]);

	const syncPreference = () => {
		const columns = unref(sourceColumns) || [];
		const saved = loadColumnPreference(storageKey);
		preference.value = mergeColumnPreference(columns, saved, options);
	};

	syncPreference();

	watch(
		() => unref(sourceColumns),
		() => syncPreference(),
		{ deep: true },
	);

	watch(
		preference,
		(value) => {
			saveColumnPreference(storageKey, value);
		},
		{ deep: true },
	);

	const displayColumns = computed(() => applyColumnPreference(unref(sourceColumns) || [], preference.value, options));

	const settingItems = computed(() => {
		const columns = unref(sourceColumns) || [];
		const columnMap = new Map(columns.map((column) => [resolveColumnKey(column), column]));
		return preference.value.map((item) => {
			const column = columnMap.get(item.key);
			return {
				...item,
				title: column ? resolveColumnTitle(column, item.key) : item.key,
			};
		});
	});

	const resetColumns = () => {
		preference.value = buildDefaultColumnPreference(unref(sourceColumns) || [], options);
	};

	const updatePreference = (items: ColumnPreferenceItem[]) => {
		preference.value = items.map((item, index) => ({
			key: item.key,
			visible: item.visible !== false,
			order: index,
		}));
	};

	return {
		displayColumns,
		preference,
		settingItems,
		resetColumns,
		updatePreference,
	};
}
