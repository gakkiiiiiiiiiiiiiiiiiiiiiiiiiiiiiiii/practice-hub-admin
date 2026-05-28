import { uploadImage } from '@/api/upload'
import {
	DEFAULT_CATEGORY_COVER_CONFIG,
	normalizeCourseCoverConfig,
	renderCourseCover,
	type CourseCoverConfig,
} from '@/utils/course-cover'

export type PackageScopeInput = {
	scope_type: string
	scope_value: string
	sub_category_path?: string[]
}

export type PackageCoverMeta = {
	courseList: any[]
	categoryTree: any[]
}

export type PackageCoverStyle = {
	backgroundColor?: string
	titleColor?: string
	categoriesColor?: string
}

export const DEFAULT_PACKAGE_COVER_STYLE: Required<PackageCoverStyle> = {
	backgroundColor: '#F4F7FB',
	titleColor: '#8A9AB3',
	categoriesColor: '#6F7F99',
}

const BASE_PACKAGE_COVER_CONFIG: CourseCoverConfig = {
	...DEFAULT_CATEGORY_COVER_CONFIG,
	fields: [
		{
			id: 'package_name',
			label: '套餐名称',
			type: 'courseField',
			sourceKey: 'name',
			x: 600,
			y: 320,
			fontSize: 72,
			color: DEFAULT_PACKAGE_COVER_STYLE.titleColor,
			backgroundColor: 'transparent',
			fontWeight: '800',
			fontFamily: DEFAULT_CATEGORY_COVER_CONFIG.fields[0]?.fontFamily,
			maxWidth: 980,
			align: 'center',
			maxLines: 1,
			lineHeight: 82,
		},
		{
			id: 'categories',
			label: '绑定分类',
			type: 'courseField',
			sourceKey: 'categories',
			x: 600,
			y: 680,
			fontSize: 88,
			color: DEFAULT_PACKAGE_COVER_STYLE.categoriesColor,
			backgroundColor: 'transparent',
			fontWeight: '900',
			fontFamily: DEFAULT_CATEGORY_COVER_CONFIG.fields[1]?.fontFamily,
			maxWidth: 1040,
			align: 'center',
			maxLines: 4,
			lineHeight: 98,
		},
	],
}

function sanitizeFileName(value: string) {
	return value.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40)
}

export function normalizeColorInput(value?: string, fallback = '#FFFFFF') {
	const raw = String(value || '').trim()
	const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw
	if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
		return `#${withoutHash.toUpperCase()}`
	}
	if (/^[0-9a-fA-F]{3}$/.test(withoutHash)) {
		return `#${withoutHash
			.split('')
			.map((char) => `${char}${char}`)
			.join('')
			.toUpperCase()}`
	}
	return fallback
}

export function normalizePackageCoverStyle(input?: PackageCoverStyle | null): Required<PackageCoverStyle> {
	return {
		backgroundColor: normalizeColorInput(input?.backgroundColor, DEFAULT_PACKAGE_COVER_STYLE.backgroundColor),
		titleColor: normalizeColorInput(input?.titleColor, DEFAULT_PACKAGE_COVER_STYLE.titleColor),
		categoriesColor: normalizeColorInput(input?.categoriesColor, DEFAULT_PACKAGE_COVER_STYLE.categoriesColor),
	}
}

export function buildPackageCoverConfig(style?: PackageCoverStyle | null): CourseCoverConfig {
	const normalized = normalizePackageCoverStyle(style)
	const config = normalizeCourseCoverConfig(BASE_PACKAGE_COVER_CONFIG, BASE_PACKAGE_COVER_CONFIG)
	config.backgroundColor = normalized.backgroundColor
	config.fields = config.fields.map((field) => {
		if (field.id === 'package_name') {
			return { ...field, color: normalized.titleColor }
		}
		if (field.id === 'categories') {
			return { ...field, color: normalized.categoriesColor }
		}
		return field
	})
	return config
}

function findSubCategoryPath(subCategoryName: string, categoryTree: any[]) {
	for (const parent of categoryTree) {
		for (const child of parent.children || []) {
			if (child.name === subCategoryName) {
				return [parent.name, child.name]
			}
		}
	}
	return subCategoryName ? [subCategoryName] : []
}

export function collectPackageCategoryNames(
	scopes: PackageScopeInput[],
	meta: PackageCoverMeta,
): string[] {
	const names: string[] = []
	const seen = new Set<string>()

	const pushName = (label: string) => {
		const normalized = String(label || '').trim()
		if (!normalized || seen.has(normalized)) return
		seen.add(normalized)
		names.push(normalized)
	}

	for (const scope of scopes || []) {
		const value = String(scope.scope_value || '').trim()
		if (!value) continue

		if (scope.scope_type === 'category') {
			pushName(value)
			continue
		}

		if (scope.scope_type === 'sub_category') {
			const path = scope.sub_category_path?.length
				? scope.sub_category_path
				: findSubCategoryPath(value, meta.categoryTree)
			if (path.length >= 2) {
				pushName(`${path[0]} · ${path[1]}`)
			} else {
				pushName(value)
			}
			continue
		}

		if (scope.scope_type === 'course') {
			const course = meta.courseList.find((item) => String(item.id) === value)
			if (!course) continue
			if (course.category && course.sub_category) {
				pushName(`${course.category} · ${course.sub_category}`)
			} else if (course.category) {
				pushName(course.category)
			} else if (course.sub_category) {
				pushName(course.sub_category)
			}
		}
	}

	return names
}

export async function generatePackageCoverFile(
	packageName: string,
	scopes: PackageScopeInput[],
	meta: PackageCoverMeta,
	style?: PackageCoverStyle | null,
): Promise<File | null> {
	const categoryNames = collectPackageCategoryNames(scopes, meta)
	if (categoryNames.length === 0) {
		return null
	}

	const canvas = await renderCourseCover(buildPackageCoverConfig(style), {
		name: String(packageName || '套餐').trim() || '套餐',
		categories: categoryNames.join('、'),
	})

	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.96))
	if (!blob) {
		throw new Error('套餐封面生成失败')
	}

	const title = sanitizeFileName(packageName || 'package')
	const fileName = `${title}-package-cover.png`
	return new File([blob], fileName, { type: 'image/png' })
}

export async function generateAndUploadPackageCover(
	packageName: string,
	scopes: PackageScopeInput[],
	meta: PackageCoverMeta,
	style?: PackageCoverStyle | null,
): Promise<string | null> {
	const coverFile = await generatePackageCoverFile(packageName, scopes, meta, style)
	if (!coverFile) {
		return null
	}
	const response = await uploadImage(coverFile)
	return response.url || response.imageUrl || null
}
