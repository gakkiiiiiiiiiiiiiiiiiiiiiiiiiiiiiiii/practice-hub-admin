export default [
  {
    url: '/api/admin/users',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10 } = query
      const mockUsers = [
        {
          id: 1,
          nickname: '考研小助手',
          openId: 'openid_123456789',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: true,
          status: 1,
          createdAt: '2024-01-01 10:00:00',
          lastLoginAt: '2024-01-20 15:30:00',
        },
        {
          id: 2,
          nickname: '学习达人',
          openId: 'openid_987654321',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: false,
          status: 1,
          createdAt: '2024-01-02 11:00:00',
          lastLoginAt: '2024-01-19 09:20:00',
        },
        {
          id: 3,
          nickname: '数学爱好者',
          openId: 'openid_111222333',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: true,
          status: 1,
          createdAt: '2024-01-03 14:20:00',
          lastLoginAt: '2024-01-21 08:15:00',
        },
        {
          id: 4,
          nickname: '英语学习者',
          openId: 'openid_444555666',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: false,
          status: 1,
          createdAt: '2024-01-05 09:30:00',
          lastLoginAt: '2024-01-18 16:45:00',
        },
        {
          id: 5,
          nickname: '政治复习者',
          openId: 'openid_777888999',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: true,
          status: 0, // 已封禁
          createdAt: '2024-01-06 11:00:00',
          lastLoginAt: '2024-01-15 10:20:00',
        },
        {
          id: 6,
          nickname: '专业课冲刺',
          openId: 'openid_aaaabbbbcccc',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: false,
          status: 1,
          createdAt: '2024-01-08 13:15:00',
          lastLoginAt: '2024-01-22 09:30:00',
        },
        {
          id: 7,
          nickname: '刷题狂人',
          openId: 'openid_ddddeeeeffff',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: true,
          status: 1,
          createdAt: '2024-01-10 15:00:00',
          lastLoginAt: '2024-01-22 14:20:00',
        },
        {
          id: 8,
          nickname: '考研小白',
          openId: 'openid_gggghhhhiiii',
          avatar: 'https://via.placeholder.com/64',
          vipStatus: false,
          status: 1,
          createdAt: '2024-01-12 10:30:00',
          lastLoginAt: '2024-01-21 20:10:00',
        },
      ]

      return {
        code: 200,
        msg: 'success',
        data: {
          list: mockUsers,
          total: mockUsers.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
  {
    url: '/api/admin/users/:id',
    method: 'get',
    response: () => {
      return {
        code: 200,
        msg: 'success',
        data: {
          userInfo: {
            id: 1,
            nickname: '用户1',
            openId: 'openid_123456789',
            avatar: '',
            vipStatus: true,
            createdAt: '2024-01-01 10:00:00',
            lastLoginAt: '2024-01-20 15:30:00',
          },
          stats: {
            totalQuestions: 500,
            correctCount: 380,
            wrongCount: 120,
            accuracy: '76%',
          },
          wrongQuestions: [
            {
              id: 1,
              content: '这是一道错题',
              subjectName: '数学',
            },
          ],
        },
      }
    },
  },
  {
    url: '/api/admin/users/:id/status',
    method: 'put',
    response: () => {
      return {
        code: 200,
        msg: '操作成功',
        data: null,
      }
    },
  },
]

