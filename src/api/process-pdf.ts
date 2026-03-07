import request from '@/utils/request';

/**
 * 单张图片 OCR 识别（题干图片转文字）
 * 需配置后端 SILICON_FLOW_API_KEY
 */
export async function ocrImage(file: File): Promise<{ text: string }> {
	const formData = new FormData();
	formData.append('image', file);

	const res = (await request.post('/admin/process-pdf/ocr-image', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
		timeout: 70000, // OCR 可能较慢，与后端 60s 对齐
	})) as { data: { text: string } };

	return { text: res.data?.text ?? '' };
}
