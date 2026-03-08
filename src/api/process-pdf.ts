import request from '@/utils/request';

/** 将 File 转为 base64 字符串（纯 base64，不含 data URL 前缀） */
function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			if (dataUrl.startsWith('data:')) {
				const comma = dataUrl.indexOf(',');
				resolve(comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl);
			} else {
				resolve(dataUrl);
			}
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

/**
 * 单张图片 OCR 识别（题干图片转文字），传 base64 数据
 * 需配置后端 SILICON_FLOW_API_KEY
 */
export async function ocrImage(file: File): Promise<{ text: string }> {
	const base64 = await fileToBase64(file);
	const res = (await request.post(
		'/admin/process-pdf/ocr-image',
		{ image: base64 },
		{ timeout: 70000 },
	)) as { data: { text: string } };
	return { text: res.data?.text ?? '' };
}

/**
 * 使用 base64 字符串直接调用 OCR（例如从图片 URL 拉取后转为 base64）
 */
export async function ocrImageBase64(base64: string): Promise<{ text: string }> {
	const res = (await request.post(
		'/admin/process-pdf/ocr-image',
		{ image: base64 },
		{ timeout: 70000 },
	)) as { data: { text: string } };
	return { text: res.data?.text ?? '' };
}
