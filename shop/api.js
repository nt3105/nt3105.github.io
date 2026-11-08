const local = ['127.0.0.1', 'localhost'].includes(location.hostname);
export const BASE = local ? location.origin : 'https://key.nt3105.io.vn';
let memoryToken;
export function accessToken() {
  if (memoryToken) return memoryToken;
  try { memoryToken = localStorage.getItem('ntjr-shop-access-v1'); } catch {}
  if (!/^[a-f0-9]{64}$/.test(memoryToken || '')) {
    memoryToken = [...crypto.getRandomValues(new Uint8Array(32))].map(x => x.toString(16).padStart(2, '0')).join('');
    try { localStorage.setItem('ntjr-shop-access-v1', memoryToken); } catch {}
  }
  return memoryToken;
}
export function restoreAccess(token) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Mã khôi phục cần đúng 64 ký tự.');
  localStorage.setItem('ntjr-shop-access-v1', token);
  memoryToken = token;
}
export async function api(path, body, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(BASE + '/api/shop' + path, {
      method: method || (body ? 'POST' : 'GET'), signal: controller.signal,
      headers: { Authorization: 'Bearer ' + accessToken(), ...(body ? { 'Content-Type': 'application/json' } : {}) },
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
