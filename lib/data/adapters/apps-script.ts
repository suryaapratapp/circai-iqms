import type {
  AdminData,
  AuthResult,
  DashboardData,
  InventoryListItem,
  LookupsData,
  RegisterInput,
  ReportsData,
  Repository,
  SearchItemResult,
  SearchShelfResult,
  WorkflowResponse
} from "@/lib/data/repository";
import { verifyPassword } from "@/lib/auth/password";
import type { SessionUser, UserRecord, WorkflowType } from "@/lib/data/types";

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
  getDashboard(session: SessionUser) {
    return request<DashboardData>("getDashboard", {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getLookups(session: SessionUser) {
    return request<LookupsData>("getLookups", {
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
    return request("getTransactions", {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  listPackedOrders(session: SessionUser) {
    return request("getPackedOrders", {
      method: "POST",
      body: JSON.stringify({ session })
    });
  },
  getPackedOrder(packingOrderId: string, session: SessionUser) {
    return request("getPackedOrder", {
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
      inbound: "inboundStock",
      "quality-check": "qualityCheck",
      "cycle-count": "cycleCount",
      "damage-item": "damageItem",
      "repair-item": "repairItem",
      packing: "packOrder",
      unpack: "unpackOrder"
    };
    return request<WorkflowResponse>(pathByWorkflow[workflow], {
      method: "POST",
      body: JSON.stringify({ workflow, payload, session })
    });
  }
};

export default appsScriptRepository;
