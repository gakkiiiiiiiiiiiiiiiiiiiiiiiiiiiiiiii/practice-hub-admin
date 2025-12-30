export default [
  {
    url: '/api/admin/stats/overview',
    method: 'get',
    response: () => {
      return {
        code: 200,
        msg: 'success',
        data: {
          totalUsers: 12345,
          todayUsers: 123,
          totalRevenue: 567890.5,
          todayOrders: 45,
        },
      }
    },
  },
  {
    url: '/api/admin/stats/agent',
    method: 'get',
    response: () => {
      return {
        code: 200,
        msg: 'success',
        data: {
          balance: 10000,
          totalCodes: 500,
          activatedCodes: 300,
          unactivatedCodes: 200,
        },
      }
    },
  },
]

