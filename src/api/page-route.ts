import request from '@/utils/request'

export interface PageRouteItem {
  id: number
  path: string
  title: string
  type: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface GetPageRoutesParams {
  type?: string
  status?: number
}

export interface SyncPageRoutesParams {
  routes: Array<{
    path: string
    title: string
    type?: string
  }>
}

export function getPageRoutes(params?: GetPageRoutesParams) {
  return request.get<PageRouteItem[]>('/admin/page-routes', { params })
}

export function syncPageRoutes(data: SyncPageRoutesParams) {
  return request.post('/admin/page-routes/sync', data)
}
