export default [
  {
    url: '/api/admin/system/accounts',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query
      const mockAccounts = [
        {
          id: 1,
          username: 'admin',
          nickname: '系统管理员',
          roles: ['super_admin'],
          createdAt: '2024-01-01 10:00:00',
        },
        {
          id: 2,
          username: 'content',
          nickname: '题库管理员',
          roles: ['content_admin'],
          createdAt: '2024-01-02 10:00:00',
        },
      ]

      return {
        code: 200,
        msg: 'success',
        data: {
          list: mockAccounts,
          total: mockAccounts.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
  {
    url: '/api/admin/system/accounts',
    method: 'post',
    response: () => {
      return {
        code: 200,
        msg: '创建成功',
        data: null,
      }
    },
  },
  {
    url: '/api/admin/system/roles',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query
      const mockRoles = [
        {
          id: 1,
          value: 'super_admin',
          name: '系统管理员',
          menus: ['dashboard', 'question:course', 'question:chapter', 'question:list'],
        },
        {
          id: 2,
          value: 'content_admin',
          name: '题库管理员',
          menus: ['question:course', 'question:chapter', 'question:list'],
        },
      ]

      return {
        code: 200,
        msg: 'success',
        data: {
          list: mockRoles,
          total: mockRoles.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
  {
    url: '/api/admin/settings/countdown',
    method: 'put',
    response: () => {
      return {
        code: 200,
        msg: '设置成功',
        data: null,
      }
    },
  },
  {
    url: '/api/admin/logs',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query
      return {
        code: 200,
        msg: 'success',
        data: {
          list: [],
          total: 0,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
]

