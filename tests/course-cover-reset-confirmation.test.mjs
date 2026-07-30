import { describe, expect, it, vi } from 'vitest';

import { createCourseCoverResetConfirmOptions } from '../src/utils/course-cover-reset-confirmation.ts';

describe('课程封面配置恢复默认确认', () => {
	it('课程封面配置使用危险操作确认文案', () => {
		const onConfirm = vi.fn();
		const options = createCourseCoverResetConfirmOptions('course', onConfirm);

		expect(options.title).toBe('恢复默认课程封面配置');
		expect(options.content).toContain('当前模板的课程封面样式');
		expect(options.content).toContain('保存前使用“撤回”还原');
		expect(options.okText).toBe('确认恢复');
		expect(options.cancelText).toBe('取消');
		expect(options.okButtonProps).toEqual({ danger: true });

		options.onOk();
		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it('分类封面配置使用对应文案', () => {
		const options = createCourseCoverResetConfirmOptions('category', vi.fn());

		expect(options.title).toBe('恢复默认分类封面配置');
		expect(options.content).toContain('当前模板的分类封面样式');
	});
});
