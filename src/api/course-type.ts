import request from '@/utils/request'

export function getCourseTypeList() {
  return request.get('/admin/course-types')
}

export function createCourseType(data: any) {
  return request.post('/admin/course-types', data)
}

export function updateCourseType(id: number, data: any) {
  return request.put(`/admin/course-types/${id}`, data)
}

export function deleteCourseType(id: number) {
  return request.delete(`/admin/course-types/${id}`)
}

export function getAppCourseTypeList() {
  return request.get('/app/course-types')
}
