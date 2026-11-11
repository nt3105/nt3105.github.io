import {BASE,accessToken,restoreAccess} from './access-store.js?v=auto-history-v3';
export {BASE,accessToken,restoreAccess};
export async function api(path, body, method) {
  const token=path==='/catalog'?'':await accessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(BASE + '/api/shop' + path, {
      method: method || (body ? 'POST' : 'GET'), signal: controller.signal,
      headers: { ...(path==='/catalog'?{}:{Authorization:'Bearer '+token}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined, cache: 'no-store', credentials: 'omit',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Yêu cầu chưa xử lý được. Vui lòng thử lại.');
    return result;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Chưa kết nối được cửa hàng. Kiểm tra mạng rồi thử lại.');
    throw error;
  } finally { clearTimeout(timeout); }
}
