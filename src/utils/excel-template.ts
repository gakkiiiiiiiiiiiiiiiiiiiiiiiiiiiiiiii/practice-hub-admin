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
		note: '【填写说明】\n\n1. 题干（必填）：题目的主要内容\n   • 支持HTML格式，可使用 <br> 换行、<strong> 加粗等标签\n   • 示例：<strong>问题：</strong>下列哪个选项是正确的？\n\n2. 选项A-D（选填）：选项的内容\n   • 选项可以为空，为空的不计入选项\n   • 例如：如果只有A、B、C三个选项，选项D可以留空\n   • 选项内容支持HTML格式\n   • 至少需要填写一个选项\n\n3. 答案（必填）：填写单个选项字母\n   • 只能填写已填写的选项字母（如A、B、C、D）\n   • 答案对应的选项必须存在，不能为空\n   • 示例：如果只填写了A、B、C选项，答案只能填A、B或C\n   • 如果答案为空或答案对应的选项不存在，导入会失败并报错\n\n4. 解析（选填）：题目的解析说明\n   • 支持HTML格式，用于解释答案\n   • 可以为空，但建议填写\n\n5. 难度（选填）：题目的难度等级\n   • 可选值：简单、中等、困难\n   • 不填写则默认为"中等"\n\n【注意事项】\n• 第一行为表头，请勿修改\n• 第二行为示例数据，导入时会被自动跳过\n• 从第三行开始填写实际题目数据\n• 题干和答案字段为必填项，答案不能为空\n• 选项可以为空，但答案必须对应已填写的选项',
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
		note: '【填写说明】\n\n1. 题干（必填）：题目的主要内容\n   • 支持HTML格式，可使用 <br> 换行、<strong> 加粗等标签\n   • 建议在题干中明确标注"多选"或"多选题"\n   • 示例：以下<strong>哪些</strong>选项是正确的？（多选）\n\n2. 选项A-D（选填）：选项的内容\n   • 选项可以为空，为空的不计入选项\n   • 例如：如果只有A、B、C三个选项，选项D可以留空\n   • 选项内容支持HTML格式\n   • 多选题至少需要填写2个选项\n\n3. 答案（必填）：填写多个选项，用英文逗号分隔\n   • 至少选择2个选项，最多选择已填写的选项数量\n   • 选项之间用英文逗号分隔，不要有空格\n   • 答案对应的选项必须存在，不能为空\n   • 示例：A,B 或 A,B,C（前提是这些选项都已填写）\n   • 如果答案为空或答案对应的选项不存在，导入会失败并报错\n\n4. 解析（选填）：题目的解析说明\n   • 支持HTML格式，用于解释答案\n   • 建议说明为什么选择这些选项\n   • 可以为空，但建议填写\n\n5. 难度（选填）：题目的难度等级\n   • 可选值：简单、中等、困难\n   • 不填写则默认为"中等"\n\n【注意事项】\n• 第一行为表头，请勿修改\n• 第二行为示例数据，导入时会被自动跳过\n• 从第三行开始填写实际题目数据\n• 题干和答案字段为必填项，答案不能为空\n• 选项可以为空，但答案必须对应已填写的选项\n• 多选题答案必须至少包含2个选项',
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
				选项A: '', // 判断题选项不需要填写，系统会自动设置
				选项B: '', // 判断题选项不需要填写，系统会自动设置
				答案: 'a', // 填写 a 或 b（不区分大小写）
				解析: '这是解析内容',
				难度: '简单',
			},
		],
		note: '【填写说明】\n\n1. 题干（必填）：题目的主要内容\n   • 支持HTML格式，可使用 <br> 换行、<strong> 加粗等标签\n   • 判断题通常是一个陈述句，需要判断其正确性\n   • 示例：<strong>判断：</strong>地球是圆的。\n\n2. 选项A（不需要填写）：系统自动设置为"正确"\n   • 判断题的选项内容不需要填写\n   • 系统会自动使用"正确"和"错误"作为选项\n   • Excel中的选项A和选项B列可以留空\n\n3. 选项B（不需要填写）：系统自动设置为"错误"\n   • 判断题的选项内容不需要填写\n   • 系统会自动使用"正确"和"错误"作为选项\n   • Excel中的选项A和选项B列可以留空\n\n4. 答案（必填）：填写 a 或 b（不区分大小写）\n   • a 或 A 表示正确，b 或 B 表示错误\n   • 只能填写 a、A、b、B 中的一个\n   • 示例：a 或 A（表示该陈述是正确的）\n   • 如果答案为空或不是a/b，导入会失败并报错\n\n5. 解析（选填）：题目的解析说明\n   • 支持HTML格式，用于解释为什么正确或错误\n   • 建议说明判断的依据\n   • 可以为空，但建议填写\n\n6. 难度（选填）：题目的难度等级\n   • 可选值：简单、中等、困难\n   • 不填写则默认为"中等"\n\n【注意事项】\n• 第一行为表头，请勿修改\n• 第二行为示例数据，导入时会被自动跳过\n• 从第三行开始填写实际题目数据\n• 题干和答案字段为必填项，答案不能为空\n• 判断题的选项内容不需要填写，系统会自动设置\n• 答案填写 a 或 b（不区分大小写）即可',
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
		note: '【填写说明】\n\n1. 题干（必填）：题目的主要内容，空白处用下划线表示\n   • 支持HTML格式，可使用 <br> 换行、<strong> 加粗等标签\n   • 空白处用连续的下划线（______）表示，建议使用4-6个下划线\n   • 多个空白处用不同的下划线标记，如：中国的首都是______，人口最多的城市是______\n   • 示例：请填写空白处：中国的首都是<strong>______</strong>。\n\n2. 答案（必填）：填写正确答案内容\n   • 单个空白：直接填写答案，如：北京\n   • 多个空白：用英文逗号分隔，顺序与题干中的空白处一一对应\n   • 示例：北京,上海（表示第一个空填"北京"，第二个空填"上海"）\n   • 答案内容支持HTML格式\n\n3. 解析（选填）：题目的解析说明\n   • 支持HTML格式，用于解释答案\n   • 建议说明每个空白处为什么填写这个答案\n   • 可以为空，但建议填写\n\n4. 难度（选填）：题目的难度等级\n   • 可选值：简单、中等、困难\n   • 不填写则默认为"中等"\n\n【注意事项】\n• 第一行为表头，请勿修改\n• 第二行为示例数据，导入时会被自动跳过\n• 从第三行开始填写实际题目数据\n• 题干和答案字段为必填项，其他字段可选\n• 题干中的下划线数量要与答案数量对应',
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
		note: '【填写说明】\n\n1. 题干（必填）：阅读材料的内容\n   • 支持HTML格式，可使用 <br> 换行、<strong> 加粗、<p> 段落等标签\n   • 这是阅读理解的背景材料，所有子题都基于此材料\n   • 示例：<p><strong>材料一：</strong></p><p>这是一段阅读材料的内容...</p>\n\n2. 子题（必填）：每个子题包含题干、选项A-D、答案、解析\n   • 本模板提供2个子题的格式，可根据需要扩展\n   • 子题1题干：第一道题的题干内容\n   • 子题1选项A-D：第一道题的四个选项\n   • 子题1答案：第一道题的答案（A、B、C、D 或 A,B 等多选格式）\n   • 子题1解析：第一道题的解析说明\n   • 子题2同理\n\n3. 答案格式：\n   • 单选题：填写单个选项字母，如 A\n   • 多选题：填写多个选项，用英文逗号分隔，如 A,B\n   • 答案必须与选项对应\n\n4. 解析（选填）：题目的解析说明\n   • 支持HTML格式，用于解释答案\n   • 建议说明为什么选择这个答案\n   • 可以为空，但建议填写\n\n5. 难度（选填）：题目的难度等级\n   • 可选值：简单、中等、困难\n   • 不填写则默认为"中等"\n\n【重要提示】\n• 阅读理解题的子题需要在系统中单独创建\n• 本模板仅提供阅读材料和子题格式参考\n• 导入时，系统会根据子题数量自动创建对应的题目\n• 第一行为表头，请勿修改\n• 第二行为示例数据，导入时会被自动跳过\n• 从第三行开始填写实际题目数据',
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
		note: '【填写说明】\n\n1. 题干（必填）：题目的主要内容\n   • 支持HTML格式，可使用 <br> 换行、<strong> 加粗、<p> 段落等标签\n   • 简答题通常是开放性问题，需要学生用自己的话回答\n   • 示例：请简述<strong>马克思主义</strong>的基本原理。\n\n2. 参考答案（必填）：题目的参考答案\n   • 支持HTML格式，可使用 <br> 换行、<p> 段落等标签\n   • 提供完整的参考答案，作为评分依据\n   • 可以包含多个要点，用 <br> 或 <p> 分隔\n   • 示例：<p>1. 第一要点内容</p><p>2. 第二要点内容</p>\n\n3. 解析（选填）：题目的解析说明\n   • 支持HTML格式，用于解释答题思路\n   • 可以说明参考答案的要点和评分标准\n   • 可以为空，但建议填写\n\n4. 难度（选填）：题目的难度等级\n   • 可选值：简单、中等、困难\n   • 不填写则默认为"中等"\n\n【注意事项】\n• 第一行为表头，请勿修改\n• 第二行为示例数据，导入时会被自动跳过\n• 从第三行开始填写实际题目数据\n• 题干和参考答案字段为必填项，其他字段可选\n• 简答题没有固定答案，参考答案应包含主要得分点',
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
	// 根据说明内容长度动态调整行高，确保内容完整显示
	const noteLines = config.note.split('\n').length;
	noteRow.height = Math.max(30, noteLines * 15); // 每行至少15像素高度
	const mergeRange = `A${noteRowIndex}:${String.fromCharCode(64 + config.columns.length)}${noteRowIndex}`;
	worksheet.mergeCells(mergeRange);
	const noteCell = worksheet.getCell(`A${noteRowIndex}`);
	noteCell.value = config.note;
	noteCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
	noteCell.font = { size: 10, color: { argb: 'FF333333' }, name: 'Microsoft YaHei' }; // 使用更深的颜色和中文友好字体
	noteCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFFFF9E6' }, // 浅黄色背景，突出说明区域
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
