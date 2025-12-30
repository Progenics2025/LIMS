import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    // Attempt to parse JSON error body
    let body: any = undefined;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch (_) {
      body = text || res.statusText;
    }
    const err: any = new Error(`${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
}

// Helper to extract user from localStorage for header propagation
function getUserContext(): { userId?: string; userRole?: string } {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return {};
    const user = JSON.parse(stored);
    return { userId: user.id, userRole: user.role };
  } catch (_) {
    return {};
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const { userId, userRole } = getUserContext();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  // Add user context headers for role-based filtering on server
  if (userId) headers['x-user-id'] = userId;
  if (userRole) headers['x-user-role'] = userRole;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const { userId, userRole } = getUserContext();
      const headers: Record<string, string> = {};

      // Add user context headers for role-based filtering
      if (userId) headers['x-user-id'] = userId;
      if (userRole) headers['x-user-role'] = userRole;

      const res = await fetch(queryKey.join("/") as string, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when window gains focus
      staleTime: 30000, // Data becomes stale after 30 seconds (was Infinity - preventing refetches)
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
