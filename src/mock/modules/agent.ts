export default [
  {
    url: '/api/admin/codes',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, status } = query
      const mockCodes = [
        {
          id: 1,
          code: 'ACT202401010001',
          batchNo: 'BATCH001',
          subjectName: '数学',
          status: 'pending',
          activatedUser: null,
          activatedAt: null,
          createdAt: '2024-01-01 10:00:00',
        },
        {
          id: 2,
          code: 'ACT202401010002',
          batchNo: 'BATCH001',
          subjectName: '数学',
          status: 'used',
          activatedUser: '考研小助手',
          activatedAt: '2024-01-15 10:30:00',
          createdAt: '2024-01-01 10:00:00',
        },
        {
          id: 3,
          code: 'ACT202401010003',
          batchNo: 'BATCH001',
          subjectName: '数学',
          status: 'pending',
          activatedUser: null,
          activatedAt: null,
          createdAt: '2024-01-01 10:00:00',
        },
        {
          id: 4,
          code: 'ACT202401020001',
          batchNo: 'BATCH002',
          subjectName: '英语',
          status: 'used',
          activatedUser: '学习达人',
          activatedAt: '2024-01-16 14:20:00',
          createdAt: '2024-01-02 11:00:00',
        },
        {
          id: 5,
          code: 'ACT202401020002',
          batchNo: 'BATCH002',
          subjectName: '英语',
          status: 'pending',
          activatedUser: null,
          activatedAt: null,
          createdAt: '2024-01-02 11:00:00',
        },
        {
          id: 6,
          code: 'ACT202401030001',
          batchNo: 'BATCH003',
          subjectName: '政治',
          status: 'used',
          activatedUser: '数学爱好者',
          activatedAt: '2024-01-17 09:15:00',
          createdAt: '2024-01-03 14:00:00',
        },
        {
          id: 7,
          code: 'ACT202401030002',
          batchNo: 'BATCH003',
          subjectName: '政治',
          status: 'pending',
          activatedUser: null,
          activatedAt: null,
          createdAt: '2024-01-03 14:00:00',
        },
        {
          id: 8,
          code: 'ACT202401040001',
          batchNo: 'BATCH004',
          subjectName: '专业课',
          status: 'used',
          activatedUser: '英语学习者',
          activatedAt: '2024-01-18 16:30:00',
          createdAt: '2024-01-04 10:30:00',
        },
      ]

      let filtered = mockCodes
      if (status) {
        filtered = mockCodes.filter((c) => c.status === status)
      }

      return {
        code: 200,
        msg: 'success',
        data: {
          list: filtered,
          total: filtered.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
  {
    url: '/api/admin/codes/generate',
    method: 'post',
    response: () => {
      return {
        code: 200,
        msg: '生成成功',
        data: null,
      }
    },
  },
  {
    url: '/api/admin/codes/buy',
    method: 'post',
    response: () => {
      return {
        code: 200,
        msg: '购买成功',
        data: null,
      }
    },
  },
  {
    url: '/api/admin/balance-log',
    method: 'get',
    response: ({ query }: any) => {
      const { page = 1, pageSize = 10, type } = query
      const mockLogs = [
        {
          id: 1,
          type: 'recharge',
          amount: 10000,
          description: '账户充值',
          createdAt: '2024-01-01 10:00:00',
        },
        {
          id: 2,
          type: 'consume',
          amount: 990,
          description: '购买激活码 - 数学 x100',
          createdAt: '2024-01-02 14:30:00',
        },
        {
          id: 3,
          type: 'consume',
          amount: 890,
          description: '购买激活码 - 英语 x100',
          createdAt: '2024-01-03 09:20:00',
        },
        {
          id: 4,
          type: 'recharge',
          amount: 5000,
          description: '账户充值',
          createdAt: '2024-01-05 11:00:00',
        },
        {
          id: 5,
          type: 'consume',
          amount: 790,
          description: '购买激活码 - 政治 x100',
          createdAt: '2024-01-06 15:45:00',
        },
        {
          id: 6,
          type: 'consume',
          amount: 1290,
          description: '购买激活码 - 专业课 x100',
          createdAt: '2024-01-08 10:30:00',
        },
        {
          id: 7,
          type: 'recharge',
          amount: 20000,
          description: '账户充值',
          createdAt: '2024-01-10 14:20:00',
        },
        {
          id: 8,
          type: 'consume',
          amount: 1980,
          description: '购买激活码 - 数学 x200',
          createdAt: '2024-01-12 16:00:00',
        },
      ]

      let filtered = mockLogs
      if (type) {
        filtered = mockLogs.filter((l) => l.type === type)
      }

      return {
        code: 200,
        msg: 'success',
        data: {
          list: filtered,
          total: filtered.length,
          page: Number(page),
          pageSize: Number(pageSize),
        },
      }
    },
  },
]

