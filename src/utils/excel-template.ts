import * as ExcelJS from 'exceljs';

/**
 * 题目类型定义
 */
export enum QuestionType {
	SINGLE_CHOICE = 1, // 单选题
	MULTIPLE_CHOICE = 2, // 多选题
	JUDGE = 3, // 判断题
	FILL_BLANK = 4, // 填空题
	READING_COMPREHENSION = 5, // 阅读理解
	SHORT_ANSWER = 6, // 简答题
}

/**
 * 题目类型配置
 */
interface QuestionTypeConfig {
	name: string;
	sheetName: string;
	columns: Array<{ header: string; width: number }>;
	exampleData: any[];
	note: string;
}

/**
 * 题目类型配置映射
 */
const questionTypeConfigs: Record<QuestionType, QuestionTypeConfig> = {
	[QuestionType.SINGLE_CHOICE]: {
		name: '单选题',
		sheetName: '单选题模板',
		columns: [
			{ header: '题干', width: 50 },
			{ header: '选项A', width: 30 },
			{ header: '选项B', width: 30 },
			{ header: '选项C', width: 30 },
			{ header: '选项D', width: 30 },
			{ header: '答案', width: 20 },
			{ header: '解析', width: 50 },
			{ header: '难度', width: 12 },
		],
		exampleData: [
			{
				题干: '下列哪个选项是正确的？',
				选项A: '选项A的内容',
				选项B: '选项B的内容',
				选项C: '选项C的内容',
				选项D: '选项D的内容',
				答案: 'A',
				解析: '这是解析内容',
				难度: '中等',
			},
		],
		note: '填写说明：\n1. 题干：题目的主要内容，支持HTML格式\n2. 选项A-D：四个选项的内容\n3. 答案：填写单个选项（如A）\n4. 解析：题目的解析说明，支持HTML格式\n5. 难度：简单、中等、困难',
	},
	[QuestionType.MULTIPLE_CHOICE]: {
		name: '多选题',
		sheetName: '多选题模板',
		columns: [
			{ header: '题干', width: 50 },
			{ header: '选项A', width: 30 },
			{ header: '选项B', width: 30 },
			{ header: '选项C', width: 30 },
			{ header: '选项D', width: 30 },
			{ header: '答案', width: 20 },
			{ header: '解析', width: 50 },
			{ header: '难度', width: 12 },
		],
		exampleData: [
			{
				题干: '以下哪些选项是正确的？（多选）',
				选项A: '选项A的内容',
				选项B: '选项B的内容',
				选项C: '选项C的内容',
				选项D: '选项D的内容',
				答案: 'A,B',
				解析: '这是解析内容',
				难度: '中等',
			},
		],
		note: '填写说明：\n1. 题干：题目的主要内容，支持HTML格式\n2. 选项A-D：四个选项的内容\n3. 答案：填写多个选项，用逗号分隔（如A,B）\n4. 解析：题目的解析说明，支持HTML格式\n5. 难度：简单、中等、困难',
	},
	[QuestionType.JUDGE]: {
		name: '判断题',
		sheetName: '判断题模板',
		columns: [
			{ header: '题干', width: 50 },
			{ header: '选项A', width: 30 },
			{ header: '选项B', width: 30 },
			{ header: '答案', width: 20 },
			{ header: '解析', width: 50 },
			{ header: '难度', width: 12 },
		],
		exampleData: [
			{
				题干: '这个说法是否正确？',
				选项A: '正确',
				选项B: '错误',
				答案: 'A',
				解析: '这是解析内容',
				难度: '简单',
			},
		],
		note: '填写说明：\n1. 题干：题目的主要内容，支持HTML格式\n2. 选项A：通常填写"正确"\n3. 选项B：通常填写"错误"\n4. 答案：填写A或B\n5. 解析：题目的解析说明，支持HTML格式\n6. 难度：简单、中等、困难',
	},
	[QuestionType.FILL_BLANK]: {
		name: '填空题',
		sheetName: '填空题模板',
		columns: [
			{ header: '题干', width: 50 },
			{ header: '答案', width: 30 },
			{ header: '解析', width: 50 },
			{ header: '难度', width: 12 },
		],
		exampleData: [
			{
				题干: '请填写空白处：中国的首都是______。',
				答案: '北京',
				解析: '这是解析内容',
				难度: '简单',
			},
		],
		note: '填写说明：\n1. 题干：题目的主要内容，支持HTML格式，空白处用下划线表示（如______）\n2. 答案：填写正确答案内容，如果有多个空，用逗号分隔（如：北京,上海）\n3. 解析：题目的解析说明，支持HTML格式\n4. 难度：简单、中等、困难',
	},
	[QuestionType.READING_COMPREHENSION]: {
		name: '阅读理解',
		sheetName: '阅读理解模板',
		columns: [
			{ header: '题干（阅读材料）', width: 50 },
			{ header: '子题1题干', width: 40 },
			{ header: '子题1选项A', width: 25 },
			{ header: '子题1选项B', width: 25 },
			{ header: '子题1选项C', width: 25 },
			{ header: '子题1选项D', width: 25 },
			{ header: '子题1答案', width: 15 },
			{ header: '子题1解析', width: 40 },
			{ header: '子题2题干', width: 40 },
			{ header: '子题2选项A', width: 25 },
			{ header: '子题2选项B', width: 25 },
			{ header: '子题2选项C', width: 25 },
			{ header: '子题2选项D', width: 25 },
			{ header: '子题2答案', width: 15 },
			{ header: '子题2解析', width: 40 },
			{ header: '难度', width: 12 },
		],
		exampleData: [
			{
				题干: '阅读以下材料，回答问题。\n材料内容...',
				子题1题干: '根据材料，第一题的题干是什么？',
				子题1选项A: '选项A',
				子题1选项B: '选项B',
				子题1选项C: '选项C',
				子题1选项D: '选项D',
				子题1答案: 'A',
				子题1解析: '子题1的解析',
				子题2题干: '根据材料，第二题的题干是什么？',
				子题2选项A: '选项A',
				子题2选项B: '选项B',
				子题2选项C: '选项C',
				子题2选项D: '选项D',
				子题2答案: 'B',
				子题2解析: '子题2的解析',
				难度: '中等',
			},
		],
		note: '填写说明：\n1. 题干：阅读材料的内容，支持HTML格式\n2. 子题：可以添加多个子题，每个子题包含题干、选项A-D、答案、解析\n3. 答案：单选题填写单个选项（如A），多选题填写多个选项用逗号分隔（如A,B）\n4. 解析：题目的解析说明，支持HTML格式\n5. 难度：简单、中等、困难\n注意：阅读理解题的子题需要在系统中单独创建，这里仅提供材料模板',
	},
	[QuestionType.SHORT_ANSWER]: {
		name: '简答题',
		sheetName: '简答题模板',
		columns: [
			{ header: '题干', width: 50 },
			{ header: '参考答案', width: 50 },
			{ header: '解析', width: 50 },
			{ header: '难度', width: 12 },
		],
		exampleData: [
			{
				题干: '请简述某个概念的主要内容。',
				参考答案: '参考答案内容...',
				解析: '这是解析内容',
				难度: '中等',
			},
		],
		note: '填写说明：\n1. 题干：题目的主要内容，支持HTML格式\n2. 参考答案：题目的参考答案，支持HTML格式\n3. 解析：题目的解析说明，支持HTML格式\n4. 难度：简单、中等、困难',
	},
};

/**
 * 创建题目类型的工作表
 */
function createQuestionTypeSheet(workbook: ExcelJS.Workbook, type: QuestionType) {
	const config = questionTypeConfigs[type];
	const worksheet = workbook.addWorksheet(config.sheetName);

	// 设置列宽
	worksheet.columns = config.columns.map((col) => ({ width: col.width }));

	// 设置表头
	const headers = config.columns.map((col) => col.header);
	const headerRow = worksheet.getRow(1);
	headerRow.values = headers;

	// 设置表头样式
	headerRow.font = { bold: true, size: 12 };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE0E0E0' },
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
	headerRow.height = 25;

	// 添加示例数据行
	config.exampleData.forEach((rowData, index) => {
		const rowValues = config.columns.map((col) => rowData[col.header] || '');
		const dataRow = worksheet.addRow(rowValues);
		dataRow.height = 20;

		// 设置数据行样式
		if (index % 2 === 0) {
			dataRow.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFF9F9F9' },
			};
		}
	});

	// 添加说明行
	const noteRowIndex = config.exampleData.length + 2;
	const noteRow = worksheet.addRow([]);
	noteRow.height = 30;
	const mergeRange = `A${noteRowIndex}:${String.fromCharCode(64 + config.columns.length)}${noteRowIndex}`;
	worksheet.mergeCells(mergeRange);
	const noteCell = worksheet.getCell(`A${noteRowIndex}`);
	noteCell.value = config.note;
	noteCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
	noteCell.font = { size: 10, color: { argb: 'FF666666' } };
	noteCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFFFF9E6' },
	};

	// 设置所有单元格的边框
	worksheet.eachRow((row, rowNumber) => {
		row.eachCell((cell) => {
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			};
			if (rowNumber > 1 && rowNumber <= config.exampleData.length + 1) {
				cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
			}
		});
	});
}

/**
 * 生成题目导入模板 Excel 文件
 * @returns Promise<Blob> Excel 文件的 Blob 对象
 */
export async function generateQuestionTemplate(): Promise<Blob> {
	const workbook = new ExcelJS.Workbook();

	// 为每种题目类型创建工作表
	// QuestionType 枚举的值：1-6
	const questionTypes = [
		QuestionType.SINGLE_CHOICE,
		QuestionType.MULTIPLE_CHOICE,
		QuestionType.JUDGE,
		QuestionType.FILL_BLANK,
		QuestionType.READING_COMPREHENSION,
		QuestionType.SHORT_ANSWER,
	];

	questionTypes.forEach((type) => {
		createQuestionTypeSheet(workbook, type);
	});

	// 生成 Blob
	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
}
