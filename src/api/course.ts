import request from '@/utils/request'

// 课程管理
export function getCourseList(params?: any) {
  return request.get('/admin/courses', { params })
}

/** 检测同名或类似课程分组（基于当前筛选范围） */
export function getSimilarCourseGroups(params?: {
  name?: string
  subject?: string
  category?: string
  subCategory?: string
  status?: number
}) {
  return request.get('/admin/courses/similar-groups', { params })
}

export function getCourseSimilarityConfig() {
  return request.get('/admin/courses/similarity-config')
}

export function setCourseSimilarityConfig(data: { threshold?: number }) {
  return request.put('/admin/courses/similarity-config', data)
}

/** 课程下拉选项（轻量，不含 introduction 等大字段） */
export function getCourseOptions(params?: { name?: string; status?: number }) {
  return request.get('/admin/courses/options', { params })
}

export function createCourse(data: any) {
  return request.post('/admin/courses', data)
}

export function updateCourse(id: number, data: any) {
  return request.put(`/admin/courses/${id}`, data)
}

export function updateCourseSort(id: number, sort: number) {
  return updateCourse(id, { sort })
}

export function getCourseDetail(id: number) {
  return request.get(`/admin/courses/${id}`)
}

export function deleteCourse(id: number) {
  return request.delete(`/admin/courses/${id}`)
}

// 相关推荐管理
export function getRecommendations(courseId?: number | null) {
  const params = courseId !== undefined && courseId !== null ? { courseId } : {};
  return request.get('/admin/courses/recommendations', { params })
}

export function updateRecommendations(data: { courseId?: number | null; recommendedCourseIds: number[] }) {
  return request.put('/admin/courses/recommendations', data)
}

// 批量删除课程
export function batchDeleteCourses(ids: number[]) {
  return request.post('/admin/courses/batch-delete', { ids })
}

// 批量更新课程状态
export function batchUpdateCourseStatus(ids: number[], status: number) {
  return request.post('/admin/courses/batch-update-status', { ids, status })
}

// 批量调整课程价格
export function batchAdjustCoursePrice(data: {
  ids?: number[]
  selectAll?: boolean
  name?: string
  subject?: string
  category?: string
  subCategory?: string
  mode: 'delta' | 'percent' | 'fixed'
  value: number
  fields?: 'price' | 'agent_price' | 'both'
}) {
  return request.post('/admin/courses/batch-adjust-price', data)
}

// 获取新增课程默认参数
export function getCourseDefaultParams() {
  return request.get('/admin/courses/default-params')
}

// 设置新增课程默认参数
export function setCourseDefaultParams(data: Record<string, unknown>) {
  return request.put('/admin/courses/default-params', data)
}

// 生成课程 PDF 图片预览缓存
export function generateCoursePreviewCache(id: number, force = true) {
  return request.post(`/admin/courses/${id}/preview-cache`, { force })
}

// 课程文件保存完成后统一生成缺失图片预览缓存
export function warmupCoursePreviewCacheAfterSave(id: number, force = false) {
  return request.post(`/admin/courses/${id}/preview-cache/warmup-after-save`, { force })
}

// 生成所有文件类 PDF 课程缺失的图片预览缓存
export function generateMissingCoursePreviewCaches() {
  return request.post('/admin/courses/preview-cache/missing')
}

// 重新生成失败课程的 PDF 图片预览缓存
export function retryFailedCoursePreviewCaches(taskId?: number) {
  return request.post('/admin/courses/preview-cache/retry-failed', taskId ? { taskId } : {})
}

// 查询课程 PDF 图片预览缓存生成进度
export function getCoursePreviewCacheProgress() {
  return request.get('/admin/courses/preview-cache/progress')
}

// 中断正在生成的课程 PDF 图片预览缓存
export function interruptCoursePreviewCacheTask() {
  return request.post('/admin/courses/preview-cache/interrupt')
}

// 检测空白预览图课程并强制重新生成
export function fixBlankCoursePreviewCaches() {
  return request.post('/admin/courses/preview-cache/fix-blank')
}

// 获取支持图片缓存的文件类课程列表
export function getPreviewCacheTargetCourses(keyword?: string) {
  return request.get('/admin/courses/preview-cache/targets', {
    params: keyword ? { keyword } : {},
  })
}

// 强制重新生成指定课程的图片预览缓存
export function forceSelectedCoursePreviewCaches(courseIds: number[]) {
  return request.post('/admin/courses/preview-cache/force-selected', { courseIds })
}

export function listCourseFiles(courseId: number) {
  return request.get(`/admin/courses/${courseId}/files`)
}

export function createCourseFile(courseId: number, data: Record<string, unknown>) {
  return request.post(`/admin/courses/${courseId}/files`, data)
}

export function updateCourseFile(courseId: number, fileId: number, data: Record<string, unknown>) {
  return request.put(`/admin/courses/${courseId}/files/${fileId}`, data)
}

export function deleteCourseFile(courseId: number, fileId: number) {
  return request.delete(`/admin/courses/${courseId}/files/${fileId}`)
}

// 检测课程 PDF 文件结构是否规范
export function getCourseFilesPdfHealth(courseId: number) {
  return request.get(`/admin/courses/${courseId}/files/pdf-health`)
}

// 检测指定 PDF 文件结构（上传后、尚未保存课程时）
export function checkCourseFilePdfHealth(fileUrl: string, displayName?: string) {
  return request.post('/admin/courses/files/pdf-health-check', { fileUrl, displayName })
}

// 获取课程文件前三页预览图状态（仅编辑已有文件课程）
export function getCoursePreviewSamplePages(id: number, fileId?: number) {
  const params = fileId ? { fileId } : {}
  return request.get(`/admin/courses/${id}/preview-sample-pages`, { params })
}

// 获取课程文件指定预览页图片（blob，仅前 3 页）
export function fetchCoursePreviewSamplePageBlob(id: number, pageNum: number, fileId?: number) {
  const params = fileId ? { fileId } : undefined
  return request.get(`/admin/courses/${id}/preview-sample-page/${pageNum}`, {
    params,
    responseType: 'blob',
  })
}
