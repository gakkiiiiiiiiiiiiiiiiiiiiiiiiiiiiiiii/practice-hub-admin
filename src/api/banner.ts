import request from '@/utils/request'

export interface BannerItem {
  id: number
  image: string
  link?: string
  title?: string
  sortOrder: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface GetBannerListParams {
  page?: number
  pageSize?: number
  status?: number
}

export interface CreateBannerParams {
  image: string
  link?: string
  title?: string
  sort_order?: number
  status?: number
}

export interface UpdateBannerParams {
  image?: string
  link?: string
  title?: string
  sort_order?: number
  status?: number
}

export function getBannerList(params?: GetBannerListParams) {
  return request.get<{ list: BannerItem[]; total: number }>('/admin/banners', { params })
}

export function getBannerDetail(id: number) {
  return request.get<BannerItem>(`/admin/banners/${id}`)
}

export function createBanner(data: CreateBannerParams) {
  return request.post('/admin/banners', data)
}

export function updateBanner(id: number, data: UpdateBannerParams) {
  return request.put(`/admin/banners/${id}`, data)
}

export function deleteBanner(id: number) {
  return request.delete(`/admin/banners/${id}`)
}

export function updateBannerSort(ids: number[]) {
  return request.put('/admin/banners/sort/update', { ids })
}
