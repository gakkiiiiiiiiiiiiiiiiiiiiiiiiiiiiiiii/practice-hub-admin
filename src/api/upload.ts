import request from '@/utils/request';

interface UploadResponse {
	code: number;
	msg: string;
	data: {
		url: string;
		imageUrl: string;
	};
}

/**
 * 上传图片到服务器
 * @param file 图片文件
 * @returns 返回图片数据，包含 url 和 imageUrl
 */
export async function uploadImage(file: File): Promise<{ url: string; imageUrl: string }> {
	const formData = new FormData();
	formData.append('file', file);

	const response = (await request.post('/admin/upload/image', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	})) as UploadResponse;

	// 返回 data 部分，方便使用
	return response.data;
}
