export function createCourseCoverResetConfirmOptions(
	configType: 'course' | 'category',
	onConfirm: () => void,
) {
	const target = configType === 'category' ? '分类封面' : '课程封面';
	return {
		title: `恢复默认${target}配置`,
		content: `将把当前模板的${target}样式恢复为系统默认值。恢复后可在保存前使用“撤回”还原，是否继续？`,
		okText: '确认恢复',
		cancelText: '取消',
		okButtonProps: {
			danger: true,
		},
		onOk: onConfirm,
	};
}
