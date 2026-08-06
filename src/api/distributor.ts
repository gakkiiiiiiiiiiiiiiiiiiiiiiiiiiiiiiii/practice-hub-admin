import request from "@/utils/request";

/**
 * 获取分销用户列表
 */
export function getDistributorList(params?: any) {
  return request.get("/admin/distributor/list", { params });
}

/**
 * 更新分销用户状态
 */
export function updateDistributorStatus(id: number, data: any) {
  return request.patch(`/admin/distributor/${id}/status`, data);
}

/**
 * 获取分销配置
 */
export function getDistributionConfig() {
  return request.get("/admin/distributor/config");
}

/**
 * 更新分销配置
 */
export function updateDistributionConfig(data: any) {
  return request.post("/admin/distributor/config", data);
}

/** 获取各级代理商价格模板及排除范围。 */
export function getAgentPriceTemplates() {
  return request.get("/admin/distributor/agent-price-templates");
}

/** 保存各级代理商价格模板及排除范围。 */
export function updateAgentPriceTemplates(data: any) {
  return request.put("/admin/distributor/agent-price-templates", data);
}

/** 将已保存并启用的模板批量应用到课程。 */
export function applyAgentPriceTemplates(agentLevel?: number) {
  return request.post(
    "/admin/distributor/agent-price-templates/apply",
    agentLevel ? { agent_level: agentLevel } : {},
  );
}

/**
 * 获取分销统计数据
 */
export function getDistributionStats() {
  return request.get("/admin/distributor/stats");
}
