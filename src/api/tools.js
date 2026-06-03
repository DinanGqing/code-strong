import client from './client';

/**
 * 获取工具列表
 * @param {object} [params] - 可选查询参数
 * @param {string} [params.category] - 按分类过滤
 * @returns {Promise<{ code: number, data: { tools: Array }, message: string }>}
 */
export async function getTools(params = {}) {
  return client.get('/tools', { params });
}

/**
 * 上传新工具（支持 JSON 或 FormData/文件）
 * @param {object|FormData} toolData
 * @returns {Promise<{ code: number, data: object, message: string }>}
 */
export async function uploadTool(toolData) {
  // FormData 时 axios 自动设 Content-Type: multipart/form-data
  return client.post('/tools', toolData);
}

/**
 * 工具下载（计数+1）
 * @param {number} id - 工具ID
 * @returns {Promise<{ code: number, data: { download_count: number }, message: string }>}
 */
export async function downloadTool(id) {
  return client.post(`/tools/${id}/download`);
}
