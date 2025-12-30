import request from '@/utils/request'

/**
 * 首页推荐管理 API
 */

// ==================== 推荐版块管理 ====================

/**
 * 获取推荐版块列表
 * @returns 返回所有推荐版块，包含旗下题库数量、状态等信息
 */
export function getCategories() {
  return request.get('/admin/recommend/categories')
}

/**
 * 获取版块详情（包含题库列表）
 * @param id 版块ID
 * @returns 返回版块详情及其下的题库列表
 */
export function getCategoryDetail(id: number) {
  return request.get(`/admin/recommend/categories/${id}`)
}

/**
 * 创建推荐版块
 * @param data 版块信息 { name: string, sort?: number, status?: number }
 */
export function createCategory(data: {
  name: string
  sort?: number
  status?: number
}) {
  return request.post('/admin/recommend/categories', data)
}

/**
 * 更新版块信息
 * @param id 版块ID
 * @param data 更新的信息 { name?: string, sort?: number, status?: number }
 */
export function updateCategory(
  id: number,
  data: {
    name?: string
    sort?: number
    status?: number
  }
) {
  return request.put(`/admin/recommend/categories/${id}`, data)
}

/**
 * 删除版块
 * @param id 版块ID
 * @note 如果版块下还有关联题库，后端会禁止删除
 */
export function deleteCategory(id: number) {
  return request.delete(`/admin/recommend/categories/${id}`)
}

// ==================== 推荐项管理 ====================

/**
 * 添加题库到版块
 * @param data 推荐项信息 { category_id: number, subject_id: number, sort?: number }
 */
export function addItem(data: {
  category_id: number
  subject_id: number
  sort?: number
}) {
  return request.post('/admin/recommend/items', data)
}

/**
 * 移除版块内的题库
 * @param id 推荐项ID
 */
export function removeItem(id: number) {
  return request.delete(`/admin/recommend/items/${id}`)
}

/**
 * 调整版块内题库排序
 * @param data 排序列表 { items: Array<{ id: number, sort: number }> }
 */
export function updateItemSort(data: {
  items: Array<{ id: number; sort: number }>
}) {
  return request.put('/admin/recommend/items/sort', data)
}

