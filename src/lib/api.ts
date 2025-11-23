import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:8000";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const apiFormData = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
  transformRequest: (data: any) => {
    if (data instanceof FormData) return data;
    return JSON.stringify(data);
  },
});

const attachAuth = (config: any) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers["Authorization"]) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return config;
};

api.interceptors.request.use(attachAuth);
apiFormData.interceptors.request.use(attachAuth);

apiFormData.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response) {
      console.error("Response error:", error.response.data);
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Request error:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export interface Article {
  id?: number;
  title: string;
  slug?: string;
  content: string;
  author_name: string;
  publication_date: string;
  image_path?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  extra_fields?: Record<string, any> | null;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface ExtraField {
  id?: number;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "boolean";
  required: boolean;
  options?: Record<string, any> | null;
}

// Users
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  active?: boolean;
}

interface ArticleBase {
  title: string;
  content: string;
  author_name: string;
  publication_date: string;
  image?: File;
}

type CreateArticleData = FormData | ArticleBase;

export const articleApi = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    author?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
  }): Promise<Article[]> => {
    const response = await api.get("/articles", { params });
    const data = response.data as any;
    const articles: Article[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    return articles;
  },

  getAllPaged: async (params?: { search?: string; page?: number }): Promise<PaginatedResponse<Article>> => {
    const response = await api.get("/articles", { params });
    const payload = response.data as any;
    if (payload && payload.meta && payload.links && Array.isArray(payload.data)) {
      return payload as PaginatedResponse<Article>;
    }
    const normalized: PaginatedResponse<Article> = {
      data: Array.isArray(payload?.data) ? payload.data : [],
      links: {
        first: payload?.first_page_url ?? null,
        last: payload?.last_page_url ?? null,
        prev: payload?.prev_page_url ?? null,
        next: payload?.next_page_url ?? null,
      },
      meta: {
        current_page: payload?.current_page ?? 1,
        from: payload?.from ?? null,
        last_page: payload?.last_page ?? 1,
        links: Array.isArray(payload?.links) ? payload.links : [],
        path: payload?.path ?? "",
        per_page: payload?.per_page ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
        to: payload?.to ?? null,
        total: payload?.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
      },
    };
    return normalized;
  },

  getBySlug: async (slug: string) => {
    try {
      const response = await api.get(`/articles/${slug}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) return null;
      throw error;
    }
  },

  create: async (articleData: CreateArticleData | FormData) => {
    if (articleData instanceof FormData) {
      const response = await apiFormData.post<Article>("/articles", articleData);
      return response.data;
    } else {
      const response = await api.post<Article>("/articles", articleData);
      return response.data;
    }
  },

  update: async (id: number, articleData: Partial<CreateArticleData> | FormData) => {
    const isFormData = articleData instanceof FormData;
    const client = isFormData ? apiFormData : api;
    if (isFormData) {
      (articleData as FormData).append("_method", "PUT");
      const response = await client.post<Article>(`/articles/${id}`, articleData);
      return response.data;
    } else {
      const response = await client.put<Article>(`/articles/${id}`, articleData);
      return response.data;
    }
  },

  delete: async (id: number) => {
    await api.delete(`/articles/${id}`);
  },

  getImageUrl: (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
  },
};

// Consumption Lists
export interface ConsumptionItemInput {
  material_name: string;
  quantity: number;
  unit?: string;
  source?: string;
}
export interface ConsumptionInput {
  article_code: string;
  article_name: string;
  article_color?: string;
  notes?: string;
  items: ConsumptionItemInput[];
}

export const consumptionApi = {
  list: async (params?: { search?: string; page?: number }) => {
    const response = await api.get('/consumptions', { params });
    return response.data as PaginatedResponse<any>;
  },
  create: async (payload: ConsumptionInput | FormData) => {
    const client = payload instanceof FormData ? apiFormData : api;
    const response = await client.post('/consumptions', payload);
    return response.data as any;
  },
  show: async (id: number) => {
    const response = await api.get(`/consumptions/${id}`);
    return response.data as any;
  },
  update: async (id: number, payload: Partial<ConsumptionInput> | FormData) => {
    const client = payload instanceof FormData ? apiFormData : api;
    const response = await client.post(`/consumptions/${id}`, payload instanceof FormData ? (() => { (payload as FormData).append('_method','PUT'); return payload; })() : payload);
    return response.data as any;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/consumptions/${id}`);
    return response.data as any;
  },
};

// Notifications
export interface NotificationItem {
  id: number;
  role: string;
  message: string;
  read_at?: string | null;
  created_at?: string;
}

export const notificationsApi = {
  list: async (params?: { role?: string; unread?: boolean; page?: number }): Promise<PaginatedResponse<NotificationItem>> => {
    const response = await api.get('/notifications', { params });
    return response.data as PaginatedResponse<NotificationItem>;
  },
  markRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data as NotificationItem;
  },
};

// Branding / Settings
export interface BrandingSettings {
  company_name?: string | null;
  company_logo_path?: string | null;
  company_logo_url?: string | null;
}

export const brandingApi = {
  get: async (): Promise<BrandingSettings> => {
    const res = await api.get('/settings/branding');
    return res.data as BrandingSettings;
  },
  update: async (data: { company_name?: string; company_logo?: File; company_logo_clear?: boolean } | FormData): Promise<BrandingSettings> => {
    const fd = data instanceof FormData ? data : (() => {
      const f = new FormData();
      if ((data as any).company_name !== undefined) f.append('company_name', (data as any).company_name);
      if ((data as any).company_logo) f.append('company_logo', (data as any).company_logo as File);
      if ((data as any).company_logo_clear) f.append('company_logo_clear', 'true');
      return f;
    })();
    const res = await apiFormData.put('/settings/branding', fd);
    return res.data as BrandingSettings;
  },
};

// Requisitions
export interface RequisitionItemInput {
  material_id: number;
  qty: number;
  notes?: string;
}
export interface RequisitionInput {
  article_id?: number;
  notes?: string;
  items: RequisitionItemInput[];
}

export const requisitionApi = {
  list: async (params?: { status?: 'pending' | 'approved' | 'rejected'; page?: number }) => {
    const response = await api.get('/requisitions', { params });
    return response.data as PaginatedResponse<any>;
  },
  create: async (payload: RequisitionInput) => {
    const response = await api.post('/requisitions', payload);
    return response.data as any;
  },
  show: async (id: number) => {
    const response = await api.get(`/requisitions/${id}`);
    return response.data as any;
  },
  approve: async (id: number, payload?: { approval_note?: string }) => {
    const response = await api.post(`/requisitions/${id}/approve`, payload || {});
    return response.data as any;
  },
  reject: async (id: number) => {
    const response = await api.post(`/requisitions/${id}/reject`);
    return response.data as any;
  },
};

// Inventory
export interface StockInPayload {
  date?: string;
  supplier_name?: string;
  quantity: number;
  unit_price?: number;
  reference?: string;
  notes?: string;
  shipment_mode?: 'Air' | 'Sea' | 'Courier' | 'Hand Carry';
  shipment_reference?: string;
}

export const inventoryApi = {
  stockIn: async (materialId: number, payload: StockInPayload) => {
    const response = await api.post(`/materials/${materialId}/stock-in`, payload);
    return response.data as { message: string; transaction: any; material: Material };
  },
  stockOut: async (
    materialId: number,
    payload: { date?: string; quantity: number; batch_no?: string; article_id?: number; reference?: string; used_shipment_number?: string; notes?: string }
  ) => {
    const response = await api.post(`/materials/${materialId}/stock-out`, payload);
    return response.data as { message: string; transaction: any; material: Material };
  },
  adjust: async (
    materialId: number,
    payload: { date?: string; quantity: number; direction: 'increase' | 'decrease'; reason: 'damaged' | 'lost' | 'expired' | 'correction'; reference?: string; notes?: string }
  ) => {
    const response = await api.post(`/materials/${materialId}/adjust`, payload);
    return response.data as { message: string; transaction: any; material: Material };
  },
  list: async (params?: { type?: 'in' | 'out' | 'adjust' | 'store_to_factory'; page?: number; search?: string; material_id?: number; from?: string; to?: string }) => {
    const response = await api.get('/transactions', { params });
    return response.data as PaginatedResponse<any>;
  },
  get: async (id: number) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data as any;
  },
  update: async (id: number, data: Partial<StockInPayload> & { used_shipment_number?: string }) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data as any;
  },
};

// User management API (endpoints to be aligned with backend)
export const userApi = {
  getAll: async (params?: { search?: string; page?: number }): Promise<PaginatedResponse<User> | { data: User[] }> => {
    const response = await api.get("/users", { params });
    const payload = response.data as any;
    if (payload && payload.meta && payload.links && Array.isArray(payload.data)) {
      return payload as PaginatedResponse<User>;
    }
    return { data: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [] } as any;
  },
  create: async (data: { name: string; email: string; password: string; role?: string; active?: boolean }) => {
    const response = await api.post<User>("/users", data);
    return response.data;
  },
  setActive: async (id: number, active: boolean) => {
    // Try PATCH /users/{id} with { active }
    try {
      const response = await api.patch(`/users/${id}`, { active });
      return response.data as User;
    } catch (e: any) {
      // fallback to POST toggle if backend uses that pattern
      const response = await api.post(`/users/${id}/${active ? "activate" : "deactivate"}`);
      return response.data as User;
    }
  },
};

// Materials
export interface MaterialField extends ExtraField {}
export interface Material {
  id?: number;
  name: string;
  material_code?: string | null;
  country_of_origin: string;
  image_path?: string | null;
  image_url?: string | null;
  extra_fields?: Record<string, any> | null;
  quantity?: number | null;
  standard_quantity?: number | null;
  latest_shipment_mode?: 'Air' | 'Sea' | 'Courier' | 'Hand Carry' | null;
  latest_shipment_reference?: string | null;
}

export const materialApi = {
  getAllPaged: async (params?: { search?: string; page?: number }): Promise<PaginatedResponse<Material>> => {
    const response = await api.get("/materials", { params });
    const payload = response.data as any;
    if (payload && payload.meta && payload.links && Array.isArray(payload.data)) {
      return payload as PaginatedResponse<Material>;
    }
    const normalized: PaginatedResponse<Material> = {
      data: Array.isArray(payload?.data) ? payload.data : [],
      links: {
        first: payload?.first_page_url ?? null,
        last: payload?.last_page_url ?? null,
        prev: payload?.prev_page_url ?? null,
        next: payload?.next_page_url ?? null,
      },
      meta: {
        current_page: payload?.current_page ?? 1,
        from: payload?.from ?? null,
        last_page: payload?.last_page ?? 1,
        links: Array.isArray(payload?.links) ? payload.links : [],
        path: payload?.path ?? "",
        per_page: payload?.per_page ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
        to: payload?.to ?? null,
        total: payload?.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0),
      },
    };
    return normalized;
  },
  create: async (data: FormData | { name: string; country_of_origin: string; image?: File; extra_fields?: Record<string, any> }) => {
    if (data instanceof FormData) {
      const response = await apiFormData.post<Material>("/materials", data);
      return response.data;
    }
    const response = await api.post<Material>("/materials", data);
    return response.data;
  },
  getById: async (id: number): Promise<Material | null> => {
    try {
      const response = await api.get(`/materials/${id}`);
      return response.data as Material;
    } catch (e: any) {
      if (e?.response?.status === 404) return null;
      throw e;
    }
  },
  update: async (
    id: number,
    data:
      | FormData
      | Partial<{ name: string; material_code?: string | null; country_of_origin?: string; standard_quantity?: number; quantity?: number; extra_fields?: Record<string, any>; image?: File }>
  ) => {
    if (data instanceof FormData) {
      data.append("_method", "PUT");
      const response = await apiFormData.post<Material>(`/materials/${id}`, data);
      return response.data;
    }
    const response = await api.put<Material>(`/materials/${id}`, data);
    return response.data;
  },
  lowStock: async (): Promise<Material[]> => {
    const response = await api.get("/materials/low-stock");
    return Array.isArray(response.data) ? response.data : [];
  },
  getImageUrl: (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
  },
};

export const extraFieldsApi = {
  list: async (token: string) => {
    const response = await api.get<ExtraField[]>("/extrafields", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  create: async (token: string, field: Omit<ExtraField, "id">) => {
    const response = await api.post<ExtraField>("/extrafields", field, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  update: async (token: string, id: number, field: Partial<Omit<ExtraField, "id">>) => {
    const response = await api.put<ExtraField>(`/extrafields/${id}`, field, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  delete: async (token: string, id: number) => {
    await api.delete(`/extrafields/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    // Login endpoint is outside of /api/v1
    const response = await axios.post(`${AUTH_BASE_URL}/api/login`, { email, password }, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    return response.data as { access_token?: string; token?: string; user?: any };
  },
  me: async () => {
    const response = await api.get("/me");
    return response.data as any;
  },
  updateMe: async (data: { name?: string; avatar?: File } | FormData) => {
    const fd = data instanceof FormData ? data : (() => {
      const f = new FormData();
      if ((data as any).name) f.append('name', (data as any).name);
      if ((data as any).avatar) f.append('avatar', (data as any).avatar as File);
      return f;
    })();
    const response = await apiFormData.patch('/me', fd);
    return response.data as any;
  },
};

export default api;
