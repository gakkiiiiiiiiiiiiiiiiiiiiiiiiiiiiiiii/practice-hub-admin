export default [
  {
    url: '/api/auth/admin/login',
    method: 'post',
    response: ({ body }: any) => {
			console.log('Mock 登录请求:', body);
			const { username, password } = body;

			if (username === 'admin' && password === '123456') {
				return {
					code: 200,
					msg: '登录成功',
					data: {
						token: 'mock_token_' + Date.now(),
						admin: {
							id: 1,
							username: 'admin',
							role: 'super_admin',
							balance: 0,
						},
					},
				};
			} else if (username === 'content' && password === '123456') {
				return {
					code: 200,
					msg: '登录成功',
					data: {
						token: 'mock_token_' + Date.now(),
						admin: {
							id: 2,
							username: 'content',
							role: 'content_admin',
							balance: 0,
						},
					},
				};
			} else if (username === 'agent' && password === '123456') {
				return {
					code: 200,
					msg: '登录成功',
					data: {
						token: 'mock_token_' + Date.now(),
						admin: {
							id: 3,
							username: 'agent',
							role: 'agent',
							balance: 10000,
						},
					},
				};
			}

			return {
				code: 401,
				msg: '用户名或密码错误',
				data: null,
			};
		},
	},
  {
    url: '/api/auth/admin/info',
    method: 'get',
    response: () => {
			return {
				code: 200,
				msg: 'success',
				data: {
					id: 1,
					username: 'admin',
					nickname: '系统管理员',
					role: 'super_admin',
					permissions: [],
				},
			};
		},
	},
];
