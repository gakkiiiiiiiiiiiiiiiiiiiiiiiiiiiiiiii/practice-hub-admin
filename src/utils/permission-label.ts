const moduleNameMap: Record<string, string> = {
	dashboard: '仪表盘',
	question: '题目管理',
	course: '课程管理',
	chapter: '章节管理',
	agent: '代理商',
	user: '用户管理',
	system: '系统管理',
};

const permissionNameMap: Record<string, string> = {
	'dashboard:view': '查看仪表盘',
	'question:view': '查看题目',
	'question:create': '新增题目',
	'question:edit': '编辑题目',
	'question:delete': '删除题目',
	'question:import': '导入题目',
	'course:view': '查看课程',
	'course:create': '新增课程',
	'course:edit': '编辑课程',
	'course:status': '切换课程状态',
	'course:delete': '删除课程',
	'chapter:view': '查看章节',
	'chapter:create': '新增章节',
	'chapter:edit': '编辑章节',
	'chapter:delete': '删除章节',
	'agent:view': '查看代理商',
	'agent:generate': '生成激活码',
	'agent:buy': '购买激活码',
	'agent:export': '导出激活码',
	'agent:balance:view': '查看代理商余额',
	'system:account:view': '查看账号',
	'system:account:create': '新增账号',
	'system:account:edit': '编辑账号',
	'system:account:delete': '删除账号',
	'system:role:view': '查看角色',
	'system:role:create': '新增角色',
	'system:role:edit': '编辑角色',
	'system:role:delete': '删除角色',
	'system:config:view': '查看系统配置',
	'system:config:edit': '编辑系统配置',
	'system:feedback:view': '查看反馈',
	'system:feedback:reply': '回复反馈',
	'system:feedback:delete': '删除反馈',
	'system:distributor:view': '查看分销',
	'system:distributor:manage': '管理分销',
	'system:recommend:view': '查看首页推荐',
	'system:recommend:edit': '编辑首页推荐',
};

export function getPermissionModuleName(module: string) {
	return moduleNameMap[module] || module;
}

export function getPermissionDisplayName(permission: string) {
	return permissionNameMap[permission] || permission;
}
