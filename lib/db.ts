const getConfig = () => {
  const endpoint = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
  const namespace = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
  const token = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

  if (!endpoint || !namespace || !token) {
    throw new Error(
      "Rork DB environment variables are not configured. " +
      "Please set EXPO_PUBLIC_RORK_DB_ENDPOINT, EXPO_PUBLIC_RORK_DB_NAMESPACE, and EXPO_PUBLIC_RORK_DB_TOKEN."
    );
  }

  return { endpoint, namespace, token };
};

const getHeaders = (withBody = false): Record<string, string> => {
  const { namespace, token } = getConfig();
  const headers: Record<string, string> = {
    "surreal-ns": namespace,
    "surreal-db": namespace,
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
  };
  if (withBody) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export interface DbResult<T = unknown> {
  time: string;
  status: string;
  result: T;
}

export async function dbQuery<T = unknown>(sql: string): Promise<T[]> {
  const { endpoint } = getConfig();
  console.log("[DB] Executing SQL:", sql.substring(0, 200));

  const response = await fetch(`${endpoint}/sql`, {
    method: "POST",
    headers: getHeaders(true),
    body: sql,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] Query failed:", response.status, errorText);
    throw new Error(`DB query failed: ${response.status} - ${errorText}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  console.log("[DB] Query returned", results.length, "result set(s)");

  const firstResult = results[0];
  if (!firstResult) {
    return [];
  }

  if (firstResult.status !== "OK") {
    console.error("[DB] Query error:", JSON.stringify(firstResult));
    throw new Error(`DB query error: ${JSON.stringify(firstResult)}`);
  }

  return firstResult.result ?? [];
}

export async function dbQueryMultiple<T = unknown>(sql: string): Promise<DbResult<T[]>[]> {
  const { endpoint } = getConfig();
  console.log("[DB] Executing multi SQL:", sql.substring(0, 200));

  const response = await fetch(`${endpoint}/sql`, {
    method: "POST",
    headers: getHeaders(true),
    body: sql,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] Multi query failed:", response.status, errorText);
    throw new Error(`DB query failed: ${response.status} - ${errorText}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  console.log("[DB] Multi query returned", results.length, "result set(s)");
  return results;
}

export async function dbGetAll<T = unknown>(table: string): Promise<T[]> {
  const { endpoint } = getConfig();
  console.log("[DB] GET all from:", table);

  const response = await fetch(`${endpoint}/key/${table}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] GET all failed:", response.status, errorText);
    throw new Error(`DB GET all failed for ${table}: ${response.status}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  return results[0]?.result ?? [];
}

export async function dbGetById<T = unknown>(table: string, id: string): Promise<T | null> {
  const { endpoint } = getConfig();
  console.log("[DB] GET by id:", table, id);

  const response = await fetch(`${endpoint}/key/${table}/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    console.error("[DB] GET by id failed:", response.status, errorText);
    throw new Error(`DB GET failed for ${table}/${id}: ${response.status}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  const records = results[0]?.result ?? [];
  return records[0] ?? null;
}

export async function dbCreate<T = unknown>(table: string, data: Record<string, unknown>): Promise<T> {
  const { endpoint } = getConfig();
  console.log("[DB] CREATE in:", table);

  const response = await fetch(`${endpoint}/key/${table}`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] CREATE failed:", response.status, errorText);
    throw new Error(`DB CREATE failed for ${table}: ${response.status}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  const records = results[0]?.result ?? [];
  return records[0] as T;
}

export async function dbCreateWithId<T = unknown>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
  const { endpoint } = getConfig();
  console.log("[DB] CREATE with id:", table, id);

  const response = await fetch(`${endpoint}/key/${table}/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] CREATE with id failed:", response.status, errorText);
    throw new Error(`DB CREATE failed for ${table}/${id}: ${response.status}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  const records = results[0]?.result ?? [];
  return records[0] as T;
}

export async function dbUpdate<T = unknown>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
  const { endpoint } = getConfig();
  console.log("[DB] UPDATE:", table, id);

  const response = await fetch(`${endpoint}/key/${table}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] UPDATE failed:", response.status, errorText);
    throw new Error(`DB UPDATE failed for ${table}/${id}: ${response.status}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  const records = results[0]?.result ?? [];
  return records[0] as T;
}

export async function dbReplace<T = unknown>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
  const { endpoint } = getConfig();
  console.log("[DB] REPLACE:", table, id);

  const response = await fetch(`${endpoint}/key/${table}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] REPLACE failed:", response.status, errorText);
    throw new Error(`DB REPLACE failed for ${table}/${id}: ${response.status}`);
  }

  const results: DbResult<T[]>[] = await response.json();
  const records = results[0]?.result ?? [];
  return records[0] as T;
}

export async function dbDelete(table: string, id: string): Promise<void> {
  const { endpoint } = getConfig();
  console.log("[DB] DELETE:", table, id);

  const response = await fetch(`${endpoint}/key/${table}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] DELETE failed:", response.status, errorText);
    throw new Error(`DB DELETE failed for ${table}/${id}: ${response.status}`);
  }

  console.log("[DB] DELETE success:", table, id);
}

export async function dbDeleteAll(table: string): Promise<void> {
  const { endpoint } = getConfig();
  console.log("[DB] DELETE ALL from:", table);

  const response = await fetch(`${endpoint}/key/${table}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DB] DELETE ALL failed:", response.status, errorText);
    throw new Error(`DB DELETE ALL failed for ${table}: ${response.status}`);
  }

  console.log("[DB] DELETE ALL success:", table);
}

export function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "CA-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function nowISO(): string {
  return new Date().toISOString();
}
