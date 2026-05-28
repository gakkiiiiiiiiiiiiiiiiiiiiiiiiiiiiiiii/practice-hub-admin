import request from '@/utils/request'

export function getPackageSectionList() {
  return request.get('/admin/packages')
}

export function getPackageSectionDetail(id: number) {
  return request.get(`/admin/packages/${id}`)
}

export function createPackageSection(data: any) {
  return request.post('/admin/packages', data)
}

export function updatePackageSection(id: number, data: any) {
  return request.put(`/admin/packages/${id}`, data)
}

export function deletePackageSection(id: number) {
  return request.delete(`/admin/packages/${id}`)
}
