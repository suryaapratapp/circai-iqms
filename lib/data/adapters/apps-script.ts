import type {
  AdminData,
  AuthResult,
  DashboardData,
  InventoryListItem,
  LookupsData,
  PackedOrderDetail,
  PackedOrderListItem,
  RegisterInput,
  ReportsData,
  Repository,
  SearchItemResult,
  SearchShelfResult,
  WorkflowLookupsData,
  WorkflowResponse
} from "@/lib/data/repository";
import { getWorkflowLookupRequirements } from "@/lib/data/repository";
import { verifyPassword } from "@/lib/auth/password";
import type {
  LocationRecord,
  SessionUser,
  TransactionRecord,
  UserRecord,
  WorkflowType
} from "@/lib/data/types";

const readCache = new Map<string, { expiresAt: number; value: unknown }>();

function getBaseUrl() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    throw new Error("GOOGLE_APPS_SCRIPT_URL is not configured.");
  }
  return url;
}

function getToken() {
  return process.env.GOOGLE_APPS_SCRIPT_TOKEN || "";
}

function buildRequestUrl(path: string) {
  const url = new URL(getBaseUrl());
  url.searchParams.set("path", path);
  if (getToken()) {
    url.searchParams.set("token", getToken());
  }
  return url.toString();
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(buildRequestUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Apps Script request failed for ${path}.`);
  }

  const data = (await response.json()) as T & { error?: string };
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(data.error);
  }
  return data as T;
}

function getCacheKey(path: string, body?: string) {
  return `${path}::${body || ""}`;
}

async function cachedRequest<T>(
  path: string,
  ttlMs: number,
  options?: RequestInit
): Promise<T> {
  const body =
    typeof options?.body === "string" ? options.body : JSON.stringify(options?.body || {});
  const cacheKey = getCacheKey(path, body);
  const now = Date.now();
  const cached = readCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const value = await request<T>(path, {
    ...options,
    body
  });
  readCache.set(cacheKey, {
    expiresAt: now + ttlMs,
    value
  });
  return value;
}

function normaliseUser(candidate: UserRecord): UserRecord {
  return {
    ...candidate,
    locationIds: Array.isArray(candidate.locationIds)
      ? candidate.locationIds
      : String(candidate.locationIds || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
    googleLinked:
      typeof candidate.googleLinked === "boolean"
        ? candidate.googleLinked
        : String(candidate.googleLinked).toLowerCase() === "true"
  };
}

export function clearAppsScriptRepositoryCache() {
  readCache.clear();
}

const appsScriptRepository: Repository = {
  async authenticate(email, password) {
    const users = await request<UserRecord[]>("getUsers", {
      method: "POST",
      body: JSON.stringify({})
    });
    const user = users
      .map(normaliseUser)
      .find(
        (candidate) => candidate.email.trim().toLowerCase() === email.trim().toLowerCase()
      );
    if (!user || user.status !== "active") {
      return { user: null, message: "No active user found for that account." };
    }
    if (user.approvalStatus !== "approved") {
      return { user: null, message: "Your account is awaiting admin approval." };
    }
    return verifyPassword(password, user.passwordHash)
      ? { user }
      : { user: null, message: "Invalid email or password." };
  },
  register(input: RegisterInput) {
    return request<AuthResult>("auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  findUserByGoogleIdentity(email: string, subject: string) {
    return request<UserRecord | null>("auth/google-user", {
      method: "POST",
      body: JSON.stringify({ email, subject })
    });
  },
  linkGoogleAccount(userId: string, googleEmail: string, googleSubject: string) {
    return request<UserRecord>("auth/google-link", {
      method: "POST",
      body: JSON.stringify({ userId, googleEmail, googleSubject })
    });
  },
  updateLastLogin(userId: string) {
    return request<void>("auth/last-login", {
      method: "POST",
      body: JSON.stringify({ userId })
    });
  },
  getAccessibleLocations(session: SessionUser) {
    return cachedRequest<LocationRecord[]>("getLocations", 5 * 60 * 1000, {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getDashboard(session: SessionUser) {
    return cachedRequest<DashboardData>("getDashboard", 15 * 1000, {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getWorkflowLookups(session: SessionUser, workflow: WorkflowType) {
    return cachedRequest<WorkflowLookupsData>("getWorkflowLookups", 60 * 1000, {
      method: "POST",
      body: JSON.stringify({
        session,
        workflow,
        ...getWorkflowLookupRequirements(workflow)
      })
    });
  },
  getLookups(session: SessionUser) {
    return cachedRequest<LookupsData>("getLookups", 60 * 1000, {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  searchShelf(code: string, session: SessionUser) {
    return request<SearchShelfResult>("searchByShelf", {
      method: "POST",
      body: JSON.stringify({ code, session })
    });
  },
  searchItem(query: string, session: SessionUser) {
    return request<SearchItemResult>("searchBySku", {
      method: "POST",
      body: JSON.stringify({ query, session })
    });
  },
  listInventory(session: SessionUser) {
    return request<InventoryListItem[]>("getInventory", {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getInventoryItem(itemId: string, session: SessionUser) {
    return request<SearchItemResult>("getInventoryItem", {
      method: "POST",
      body: JSON.stringify({ itemId, session })
    });
  },
  getReports(session: SessionUser) {
    return request<ReportsData>("getReports", {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getAdminData(session: SessionUser) {
    return request<AdminData>("getAdminData", {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  listTransactions(session: SessionUser) {
    return cachedRequest<TransactionRecord[]>("getTransactions", 15 * 1000, {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  listPackedOrders(session: SessionUser) {
    return cachedRequest<PackedOrderListItem[]>("getPackedOrders", 15 * 1000, {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getPackedOrder(packingOrderId: string, session: SessionUser) {
    return cachedRequest<PackedOrderDetail | null>("getPackedOrder", 15 * 1000, {
      method: "POST",
      body: JSON.stringify({ packingOrderId, session })
    });
  },
  processWorkflow(
    workflow: WorkflowType,
    payload: Record<string, unknown>,
    session: SessionUser
  ) {
    const pathByWorkflow: Record<WorkflowType, string> = {
      receive: "receiveStock",
      "damage-item": "damageItem",
      "repair-item": "repairItem",
      packing: "packOrder",
      unpack: "unpackOrder"
    };
    return request<WorkflowResponse>(pathByWorkflow[workflow], {
      method: "POST",
      body: JSON.stringify({ workflow, payload, session })
    }).then((result) => {
      clearAppsScriptRepositoryCache();
      return result;
    });
  }
};

export default appsScriptRepository;
