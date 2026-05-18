export function getDefaultAdminPath(role?: string, permissions: string[] = []) {
	if (role === 'super_admin') return '/dashboard/analysis';
	if (role === 'agent') return '/dashboard/agent-workbench';
	if (role === 'content_admin') return '/question/course';
	if (permissions.includes('course:view')) return '/question/course';
	if (permissions.includes('question:view')) return '/question/category';
	if (permissions.includes('chapter:view')) return '/question/chapter';
	return '/403';
}

export function isForbiddenRedirect(path?: string, role?: string) {
	if (!path) return true;
	if (path === '/' || path === '/login' || path === '/403' || path.startsWith('/404')) return true;
	if ((path === '/dashboard' || path === '/dashboard/analysis') && role !== 'super_admin') return true;
	if (path === '/dashboard/agent-workbench' && role !== 'agent') return true;
	return false;
}
