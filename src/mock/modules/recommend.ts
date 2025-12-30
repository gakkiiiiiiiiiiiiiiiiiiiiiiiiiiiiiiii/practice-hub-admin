// Mock 推荐版块数据
const mockCategories = [
	{
		id: 1,
		name: '热门公共课',
		sort: 0,
		status: 1,
		item_count: 3,
	},
	{
		id: 2,
		name: '专业课推荐',
		sort: 1,
		status: 1,
		item_count: 2,
	},
	{
		id: 3,
		name: '真题专区',
		sort: 2,
		status: 1,
		item_count: 4,
	},
]

// Mock 推荐项数据
const mockItems = [
	{ id: 1, category_id: 1, subject_id: 1, sort: 0 },
	{ id: 2, category_id: 1, subject_id: 2, sort: 1 },
	{ id: 3, category_id: 1, subject_id: 3, sort: 2 },
	{ id: 4, category_id: 2, subject_id: 4, sort: 0 },
	{ id: 5, category_id: 2, subject_id: 1, sort: 1 },
	{ id: 6, category_id: 3, subject_id: 1, sort: 0 },
	{ id: 7, category_id: 3, subject_id: 2, sort: 1 },
	{ id: 8, category_id: 3, subject_id: 3, sort: 2 },
	{ id: 9, category_id: 3, subject_id: 4, sort: 3 },
]

export default [
	{
		url: '/api/admin/recommend/categories',
		method: 'get',
		response: () => {
			return {
				code: 200,
				msg: 'success',
				data: mockCategories,
			}
		},
	},
	{
		url: '/api/admin/recommend/categories/:id',
		method: 'get',
		response: ({ url }: any) => {
			const id = Number(url.match(/\/categories\/(\d+)/)?.[1])
			const category = mockCategories.find((c) => c.id === id)
			const items = mockItems.filter((item) => item.category_id === id)

			if (category) {
				return {
					code: 200,
					msg: 'success',
					data: {
						id: category.id,
						name: category.name,
						sort: category.sort,
						status: category.status,
						items: items,
					},
				}
			}

			return {
				code: 404,
				msg: '版块不存在',
				data: null,
			}
		},
	},
	{
		url: '/api/admin/recommend/categories',
		method: 'post',
		response: ({ body }: any) => {
			const newCategory = {
				id: mockCategories.length + 1,
				name: body.name,
				sort: body.sort || 0,
				status: body.status !== undefined ? body.status : 1,
				item_count: 0,
			}
			mockCategories.push(newCategory)
			return {
				code: 200,
				msg: '创建成功',
				data: newCategory,
			}
		},
	},
	{
		url: '/api/admin/recommend/categories/:id',
		method: 'put',
		response: ({ body, url }: any) => {
			const id = Number(url.match(/\/categories\/(\d+)/)?.[1])
			const index = mockCategories.findIndex((c) => c.id === id)
			if (index !== -1) {
				Object.assign(mockCategories[index], body)
				return {
					code: 200,
					msg: '更新成功',
					data: mockCategories[index],
				}
			}
			return {
				code: 404,
				msg: '版块不存在',
				data: null,
			}
		},
	},
	{
		url: '/api/admin/recommend/categories/:id',
		method: 'delete',
		response: ({ url }: any) => {
			const id = Number(url.match(/\/categories\/(\d+)/)?.[1])
			const index = mockCategories.findIndex((c) => c.id === id)
			if (index !== -1) {
				// 检查是否有关联题库
				const hasItems = mockItems.some((item) => item.category_id === id)
				if (hasItems) {
					return {
						code: 400,
						msg: '该版块下还有关联题库，无法删除',
						data: null,
					}
				}
				mockCategories.splice(index, 1)
				return {
					code: 200,
					msg: '删除成功',
					data: { success: true },
				}
			}
			return {
				code: 404,
				msg: '版块不存在',
				data: null,
			}
		},
	},
	{
		url: '/api/admin/recommend/items',
		method: 'post',
		response: ({ body }: any) => {
			const newItem = {
				id: mockItems.length + 1,
				category_id: body.category_id,
				subject_id: body.subject_id,
				sort: body.sort || 0,
			}
			mockItems.push(newItem)
			// 更新版块的题库数量
			const category = mockCategories.find((c) => c.id === body.category_id)
			if (category) {
				category.item_count = mockItems.filter((item) => item.category_id === body.category_id).length
			}
			return {
				code: 200,
				msg: '添加成功',
				data: newItem,
			}
		},
	},
	{
		url: '/api/admin/recommend/items/:id',
		method: 'delete',
		response: ({ url }: any) => {
			const id = Number(url.match(/\/items\/(\d+)/)?.[1])
			const index = mockItems.findIndex((item) => item.id === id)
			if (index !== -1) {
				const item = mockItems[index]
				mockItems.splice(index, 1)
				// 更新版块的题库数量
				const category = mockCategories.find((c) => c.id === item.category_id)
				if (category) {
					category.item_count = mockItems.filter((i) => i.category_id === item.category_id).length
				}
				return {
					code: 200,
					msg: '移除成功',
					data: { success: true },
				}
			}
			return {
				code: 404,
				msg: '记录不存在',
				data: null,
			}
		},
	},
	{
		url: '/api/admin/recommend/items/sort',
		method: 'put',
		response: ({ body }: any) => {
			body.items.forEach((item: any) => {
				const index = mockItems.findIndex((i) => i.id === item.id)
				if (index !== -1) {
					mockItems[index].sort = item.sort
				}
			})
			return {
				code: 200,
				msg: '排序更新成功',
				data: { success: true },
			}
		},
	},
]

