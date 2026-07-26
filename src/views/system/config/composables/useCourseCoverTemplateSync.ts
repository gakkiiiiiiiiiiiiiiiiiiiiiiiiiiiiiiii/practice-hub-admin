import { ref } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { getCourseList, updateCourse } from '@/api/course';
import { uploadImage } from '@/api/upload';
import {
	normalizeCourseCoverTemplatePack,
	renderCourseCover,
	resolveCourseCoverTemplateByCategory,
	type CourseCoverTemplatePack,
} from '@/utils/course-cover';

interface CourseCoverSyncTarget {
	id: number;
	name?: string;
	subject?: string;
	category?: string;
	sub_category?: string;
	school?: string;
	major?: string;
	exam_year?: string;
	answer_year?: string;
}

function getResponseData<T>(response: any): T {
	return (response?.data ?? response) as T;
}

function sanitizeFileName(value: string) {
	return value.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 40);
}

function canvasToPng(canvas: HTMLCanvasElement) {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error('课程封面生成失败'));
				}
			},
			'image/png',
			0.96,
		);
	});
}

async function generateCourseCoverFile(
	course: CourseCoverSyncTarget,
	templatePack: CourseCoverTemplatePack,
) {
	const template = resolveCourseCoverTemplateByCategory(templatePack, course);
	const school = course.school?.trim() || course.category?.trim() || course.name?.trim() || '课程';
	const major = course.major?.trim() || course.sub_category?.trim() || course.name?.trim() || '封面';
	const canvas = await renderCourseCover(template.config, {
		name: course.name,
		subject: course.subject,
		category: course.category,
		sub_category: course.sub_category,
		school,
		major,
		exam_year: course.exam_year?.trim() || '待更新',
		answer_year: course.answer_year?.trim() || '待更新',
	});
	const blob = await canvasToPng(canvas);
	return new File([blob], `${sanitizeFileName(school)}-${sanitizeFileName(major)}-cover.png`, {
		type: 'image/png',
	});
}

function confirmCourseCoverSync(templateName: string, count: number) {
	return new Promise<boolean>((resolve) => {
		Modal.confirm({
			title: '同步当前模板封面',
			content: `将重新生成并覆盖 ${count} 门实际使用「${templateName}」的课程封面，其他模板对应的课程不会受影响。是否继续？`,
			okText: '确认同步',
			cancelText: '取消',
			onOk: () => resolve(true),
			onCancel: () => resolve(false),
		});
	});
}

export function useCourseCoverTemplateSync() {
	const syncing = ref(false);

	const syncCurrentTemplate = async (payload: {
		templateId: string;
		templatePack: CourseCoverTemplatePack;
	}) => {
		const templatePack = normalizeCourseCoverTemplatePack(payload.templatePack, { configType: 'course' });
		const currentTemplate = templatePack.templates.find((template) => template.id === payload.templateId);
		if (!currentTemplate) {
			message.error('当前课程封面模板不存在，请刷新后重试');
			return;
		}

		syncing.value = true;
		const progressMessageKey = 'sync-course-cover-template';
		try {
			const response = await getCourseList();
			const courses = getResponseData<CourseCoverSyncTarget[]>(response);
			const targets = (Array.isArray(courses) ? courses : []).filter((course) => {
				const resolved = resolveCourseCoverTemplateByCategory(templatePack, course);
				return resolved.id === currentTemplate.id;
			});
			if (!targets.length) {
				message.info(`模板「${currentTemplate.name}」当前没有对应课程`);
				return;
			}

			const confirmed = await confirmCourseCoverSync(currentTemplate.name, targets.length);
			if (!confirmed) return;

			let successCount = 0;
			const failures: Array<{ course: CourseCoverSyncTarget; reason: string }> = [];
			message.loading({
				content: `正在同步「${currentTemplate.name}」0/${targets.length}...`,
				key: progressMessageKey,
				duration: 0,
			});

			for (const [index, course] of targets.entries()) {
				try {
					const coverFile = await generateCourseCoverFile(course, templatePack);
					const uploadResponse = await uploadImage(coverFile);
					const coverUrl = uploadResponse.url || uploadResponse.imageUrl;
					if (!coverUrl) throw new Error('封面上传未返回地址');
					await updateCourse(course.id, { cover_img: coverUrl });
					successCount += 1;
				} catch (error: any) {
					failures.push({
						course,
						reason: error?.message || '未知错误',
					});
				}
				message.loading({
					content: `正在同步「${currentTemplate.name}」${index + 1}/${targets.length}...`,
					key: progressMessageKey,
					duration: 0,
				});
			}

			if (!failures.length) {
				message.success({
					content: `模板「${currentTemplate.name}」已同步 ${successCount} 门课程封面`,
					key: progressMessageKey,
					duration: 3,
				});
				return;
			}

			const firstFailure = failures[0];
			message.warning({
				content: `同步完成：成功 ${successCount} 门，失败 ${failures.length} 门。首个失败课程「${firstFailure.course.name || firstFailure.course.id}」：${firstFailure.reason}`,
				key: progressMessageKey,
				duration: 6,
			});
		} catch (error: any) {
			message.error({
				content: error?.message || '获取课程或同步封面失败',
				key: progressMessageKey,
				duration: 4,
			});
		} finally {
			syncing.value = false;
		}
	};

	return {
		syncing,
		syncCurrentTemplate,
	};
}
