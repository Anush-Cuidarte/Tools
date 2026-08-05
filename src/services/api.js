const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  get isAuthenticated() {
    return !!this.token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (res.status === 401) {
      this.clearToken();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new Error(data.detail || 'Sesión expirada');
    }

    if (!res.ok) {
      const msg =
        data.error || data.detail || Object.values(data).flat().join(', ') || 'Error de red';
      const err = new Error(msg);
      if (data.code) err.code = data.code;
      throw err;
    }

    return data;
  }

  // ── Auth ──

  register({ username, email, password, password2 }) {
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, password2 }),
    });
  }

  login({ username, password }) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  googleLogin(idToken) {
    return this.request('/auth/google/', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
  }

  me() {
    return this.request('/auth/me/');
  }

  // ── Info usuario ──

  userInfo() {
    return this.request('/user-info/');
  }

  // ── Planes ──

  getPlanes() {
    return this.request('/planes/');
  }

  // ── Suscripción ──

  crearSuscripcion(planId) {
    return this.request('/suscripciones/crear/', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  miSuscripcion() {
    return this.request('/suscripciones/mi-suscripcion/');
  }

  // ── Demo ──

  /**
   * Fetch current demo usage state for a device.
   * Creates a record if none exists.
   */
  demoEstado(deviceId, toolSlug = '') {
    const params = new URLSearchParams({ device_id: deviceId });
    if (toolSlug) params.set('tool_slug', toolSlug);
    return this.request(`/demo/estado/?${params}`);
  }

  /**
   * Consume a demo action (calc or export).
   * This is the backend source-of-truth for limits.
   */
  demoConsumir(deviceId, tipo, toolSlug = '') {
    return this.request('/demo/consumir/', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, tipo, tool_slug: toolSlug }),
    });
  }

  // ── Export (solo analytics) ──

  registrarExport(toolSlug, options = {}) {
    const body = { tool_slug: toolSlug };
    if (options.demo) {
      body.demo = true;
      body.anonymous_id = options.anonymousId || '';
    }
    return this.request('/export/registrar/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient();

/**
 * Build an absolute URL on the backend host (e.g. allauth pages like the
 * password reset form), which lives on a different origin than this SPA.
 */
export function authUrl(path = '') {
  return new URL(path, new URL('../', API_BASE)).href;
}

export default api;
