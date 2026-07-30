import { describe, expect, it } from 'vitest';

import { isCourseCoverSyncTarget } from '../src/utils/course-cover-sync-target.ts';

const boundTemplate = {
	id: 'paper-exam-circuit',
	bindCategory: ['考研真题', '电路'],
};

describe('课程封面模板同步范围', () => {
	it('已绑定模板只同步命中完整分类路径的课程', () => {
		expect(
			isCourseCoverSyncTarget(boundTemplate, boundTemplate, {
				category: '考研真题',
				sub_category: '电路',
			}),
		).toBe(true);
	});

	it('已绑定模板作为兜底模板时不包含其他分类课程', () => {
		expect(
			isCourseCoverSyncTarget(boundTemplate, boundTemplate, {
				category: '考研真题',
				sub_category: '机械',
			}),
		).toBe(false);
		expect(
			isCourseCoverSyncTarget(boundTemplate, boundTemplate, {
				category: '职业考试',
				sub_category: '电路',
			}),
		).toBe(false);
	});

	it('课程实际解析到其他模板时不属于当前模板', () => {
		expect(
			isCourseCoverSyncTarget(
				boundTemplate,
				{ id: 'another-template', bindCategory: ['考研真题', '电路'] },
				{ category: '考研真题', sub_category: '电路' },
			),
		).toBe(false);
	});

	it('未绑定分类的默认模板仍同步实际解析到它的课程', () => {
		const defaultTemplate = { id: 'default' };
		expect(
			isCourseCoverSyncTarget(defaultTemplate, defaultTemplate, {
				category: '其他分类',
				sub_category: '其他子类',
			}),
		).toBe(true);
	});
});
