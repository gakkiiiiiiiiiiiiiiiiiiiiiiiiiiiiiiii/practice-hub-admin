const mockSubjects = [
	{
		id: 1,
		name: '数学',
		cover_img: 'https://via.placeholder.com/150',
		price: 99.0,
		is_vip_free: 0,
		sort: 1,
	},
	{
		id: 2,
		name: '英语',
		cover_img: 'https://via.placeholder.com/150',
		price: 89.0,
		is_vip_free: 1,
		sort: 2,
	},
	{
		id: 3,
		name: '政治',
		cover_img: 'https://via.placeholder.com/150',
		price: 79.0,
		is_vip_free: 0,
		sort: 3,
	},
	{
		id: 4,
		name: '专业课',
		cover_img: 'https://via.placeholder.com/150',
		price: 129.0,
		is_vip_free: 0,
		sort: 4,
	},
];

const mockChapters = [
	// 数学课程章节
	{ id: 1, subject_id: 1, name: '2024年真题', sort: 1, is_free: 0, type: 'year' },
	{ id: 2, subject_id: 1, name: '2023年真题', sort: 2, is_free: 0, type: 'year' },
	{ id: 3, subject_id: 1, name: '2022年真题', sort: 3, is_free: 1, type: 'year' },
	{ id: 4, subject_id: 1, name: '高等数学基础', sort: 4, is_free: 0, type: 'chapter' },
	{ id: 5, subject_id: 1, name: '线性代数', sort: 5, is_free: 0, type: 'chapter' },
	// 英语课程章节
	{ id: 6, subject_id: 2, name: '2024年真题', sort: 1, is_free: 0, type: 'year' },
	{ id: 7, subject_id: 2, name: '2023年真题', sort: 2, is_free: 0, type: 'year' },
	{ id: 8, subject_id: 2, name: '词汇专项', sort: 3, is_free: 1, type: 'chapter' },
	{ id: 9, subject_id: 2, name: '阅读理解', sort: 4, is_free: 0, type: 'chapter' },
	// 政治课程章节
	{ id: 10, subject_id: 3, name: '2024年真题', sort: 1, is_free: 0, type: 'year' },
	{ id: 11, subject_id: 3, name: '马克思主义基本原理', sort: 2, is_free: 0, type: 'chapter' },
	{ id: 12, subject_id: 3, name: '毛泽东思想和中国特色社会主义', sort: 3, is_free: 0, type: 'chapter' },
	// 专业课章节
	{ id: 13, subject_id: 4, name: '2024年真题', sort: 1, is_free: 0, type: 'year' },
	{ id: 14, subject_id: 4, name: '数据结构', sort: 2, is_free: 0, type: 'chapter' },
];

const mockQuestions = [
	{
		id: 1,
		chapter_id: 1,
		type: 1, // 单选题
		stem: "<p>设函数 $f(x) = x^2 + 2x + 1$，则 $f'(x) = $</p>",
		options: [
			{ label: 'A', text: '$2x + 2$' },
			{ label: 'B', text: '$2x + 1$' },
			{ label: 'C', text: '$x + 2$' },
			{ label: 'D', text: '$2x$' },
		],
		answer: ['A'],
		analysis: "<p>根据求导法则，$f'(x) = 2x + 2$，故选A。</p>",
		chapter: { id: 1, name: '2024年真题', subject_id: 1, subject: { id: 1, name: '数学' } },
	},
	{
		id: 2,
		chapter_id: 1,
		type: 2, // 多选题
		stem: '<p>下列哪些是偶函数？</p>',
		options: [
			{ label: 'A', text: '$f(x) = x^2$' },
			{ label: 'B', text: '$f(x) = |x|$' },
			{ label: 'C', text: '$f(x) = x^3$' },
			{ label: 'D', text: '$f(x) = \\cos x$' },
		],
		answer: ['A', 'B', 'D'],
		analysis: '<p>偶函数满足 $f(-x) = f(x)$，$x^2$、$|x|$ 和 $\\cos x$ 都是偶函数，而 $x^3$ 是奇函数。</p>',
		chapter: { id: 1, name: '2024年真题', subject_id: 1, subject: { id: 1, name: '数学' } },
	},
	{
		id: 3,
		chapter_id: 1,
		type: 3, // 判断题
		stem: '<p>函数 $f(x) = x^2$ 在 $x = 0$ 处可导。</p>',
		options: [
			{ label: 'A', text: '正确' },
			{ label: 'B', text: '错误' },
		],
		answer: ['A'],
		analysis: "<p>$f'(x) = 2x$，在 $x = 0$ 处 $f'(0) = 0$，因此可导。</p>",
		chapter: { id: 1, name: '2024年真题', subject_id: 1, subject: { id: 1, name: '数学' } },
	},
	{
		id: 4,
		chapter_id: 1,
		type: 4, // 填空题
		stem: "<p>函数 $f(x) = x^2$ 的导数为 $f'(x) = $______</p>",
		options: [],
		answer: ['2x'],
		analysis: "<p>根据幂函数求导法则，$(x^n)' = nx^{n-1}$，所以 $(x^2)' = 2x$。</p>",
		chapter: { id: 1, name: '2024年真题', subject_id: 1, subject: { id: 1, name: '数学' } },
	},
	{
		id: 5,
		chapter_id: 6,
		type: 1, // 单选题
		stem: '<p>Choose the word that best completes the sentence: "I have been studying English ______ five years."</p>',
		options: [
			{ label: 'A', text: 'for' },
			{ label: 'B', text: 'since' },
			{ label: 'C', text: 'during' },
			{ label: 'D', text: 'in' },
		],
		answer: ['A'],
		analysis: '<p>"for" 用于表示一段时间，后面接时间段，如 "for five years"。</p>',
		chapter: { id: 6, name: '2024年真题', subject_id: 2, subject: { id: 2, name: '英语' } },
	},
	{
		id: 6,
		chapter_id: 6,
		type: 2, // 多选题
		stem: '<p>Which of the following are modal verbs?</p>',
		options: [
			{ label: 'A', text: 'can' },
			{ label: 'B', text: 'should' },
			{ label: 'C', text: 'go' },
			{ label: 'D', text: 'must' },
		],
		answer: ['A', 'B', 'D'],
		analysis: '<p>情态动词包括 can, should, must 等，而 go 是实义动词。</p>',
		chapter: { id: 6, name: '2024年真题', subject_id: 2, subject: { id: 2, name: '英语' } },
	},
	{
		id: 7,
		chapter_id: 10,
		type: 1, // 单选题
		stem: '<p>马克思主义哲学的根本特征是（ ）</p>',
		options: [
			{ label: 'A', text: '实践性' },
			{ label: 'B', text: '科学性' },
			{ label: 'C', text: '革命性' },
			{ label: 'D', text: '实践性、科学性、革命性的统一' },
		],
		answer: ['D'],
		analysis: '<p>马克思主义哲学的根本特征是实践性、科学性、革命性的统一。</p>',
		chapter: { id: 10, name: '2024年真题', subject_id: 3, subject: { id: 3, name: '政治' } },
	},
	{
		id: 8,
		chapter_id: 13,
		type: 1, // 单选题
		stem: '<p>下列数据结构中，属于线性结构的是（ ）</p>',
		options: [
			{ label: 'A', text: '树' },
			{ label: 'B', text: '图' },
			{ label: 'C', text: '栈' },
			{ label: 'D', text: '堆' },
		],
		answer: ['C'],
		analysis: '<p>栈是一种线性数据结构，具有后进先出（LIFO）的特点。</p>',
		chapter: { id: 13, name: '2024年真题', subject_id: 4, subject: { id: 4, name: '专业课' } },
	},
];

export default [
	{
		url: '/api/admin/subjects',
		method: 'get',
		response: () => {
			// 后端返回的是数组，不是分页对象
			return {
				code: 200,
				msg: 'success',
				data: mockSubjects,
			};
		},
	},
	{
		url: '/api/admin/subjects',
		method: 'post',
		response: () => {
			return {
				code: 200,
				msg: '创建成功',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/subjects/:id',
		method: 'put',
		response: () => {
			return {
				code: 200,
				msg: '更新成功',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/subjects/:id',
		method: 'delete',
		response: () => {
			return {
				code: 200,
				msg: '删除成功',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/chapters',
		method: 'get',
		response: ({ query }: any) => {
			const { subject_id } = query;
			let filtered = mockChapters;
			if (subject_id) {
				filtered = mockChapters.filter((c) => c.subject_id === Number(subject_id));
			}
			// 后端返回的是数组，不是分页对象
			return {
				code: 200,
				msg: 'success',
				data: filtered,
			};
		},
	},
	{
		url: '/api/admin/chapters',
		method: 'post',
		response: ({ body }: any) => {
			const newChapter = {
				id: mockChapters.length + 1,
				...body,
			};
			mockChapters.push(newChapter);
			return {
				code: 200,
				msg: '创建成功',
				data: newChapter,
			};
		},
	},
	{
		url: '/api/admin/chapters/:id',
		method: 'put',
		response: ({ body, url }: any) => {
			const id = Number(url.match(/\/chapters\/(\d+)/)?.[1]);
			const index = mockChapters.findIndex((c) => c.id === id);
			if (index !== -1) {
				Object.assign(mockChapters[index], body);
				return {
					code: 200,
					msg: '更新成功',
					data: mockChapters[index],
				};
			}
			return {
				code: 404,
				msg: '章节不存在',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/chapters/:id',
		method: 'delete',
		response: ({ url }: any) => {
			const id = Number(url.match(/\/chapters\/(\d+)/)?.[1]);
			const index = mockChapters.findIndex((c) => c.id === id);
			if (index !== -1) {
				mockChapters.splice(index, 1);
				return {
					code: 200,
					msg: '删除成功',
					data: null,
				};
			}
			return {
				code: 404,
				msg: '章节不存在',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/questions',
		method: 'get',
		response: ({ query }: any) => {
			const { subject_id, chapter_id, type } = query;
			let filtered = mockQuestions;

			// 根据课程筛选
			if (subject_id) {
				filtered = filtered.filter((q: any) => q.chapter?.subject_id === Number(subject_id));
			}

			// 根据章节筛选
			if (chapter_id) {
				filtered = filtered.filter((q: any) => q.chapter_id === Number(chapter_id));
			}

			// 根据题型筛选
			if (type) {
				filtered = filtered.filter((q: any) => q.type === Number(type));
			}

			// 格式化返回数据，添加课程和章节名称
			const formatted = filtered.map((q: any) => ({
				...q,
				subjectName: q.chapter?.subject?.name || '',
				chapterName: q.chapter?.name || '',
			}));

			return {
				code: 200,
				msg: 'success',
				data: formatted,
			};
		},
	},
	{
		url: '/api/admin/questions/:id',
		method: 'get',
		response: ({ url }: any) => {
			const id = Number(url.match(/\/questions\/(\d+)/)?.[1]);
			const question = mockQuestions.find((q: any) => q.id === id);

			if (question) {
				return {
					code: 200,
					msg: 'success',
					data: question,
				};
			}

			return {
				code: 404,
				msg: '题目不存在',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/questions/:id',
		method: 'delete',
		response: ({ url }: any) => {
			const id = Number(url.match(/\/questions\/(\d+)/)?.[1]);
			const index = mockQuestions.findIndex((q: any) => q.id === id);

			if (index !== -1) {
				mockQuestions.splice(index, 1);
				return {
					code: 200,
					msg: '删除成功',
					data: { success: true },
				};
			}

			return {
				code: 404,
				msg: '题目不存在',
				data: null,
			};
		},
	},
	{
		url: '/api/admin/upload/image',
		method: 'post',
		response: () => {
			// Mock 返回一个占位图片URL
			return {
				code: 200,
				msg: '上传成功',
				data: {
					url: 'https://via.placeholder.com/400x300',
				},
			};
		},
	},
];
