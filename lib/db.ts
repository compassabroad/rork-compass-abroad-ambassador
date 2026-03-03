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

/** Converts a JS value to a SurrealQL literal for safe parameter binding (e.g. in LET $x = value). */
function toSurrealLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return "NONE";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    const escaped = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `'${escaped}'`;
  }
  throw new Error("Unsupported parameter type for SurrealQL literal");
}

/**
 * Execute a single SurrealQL query with optional parameter binding (SQL injection safe).
 * Use $paramName in the query and pass { paramName: value } as the second argument.
 * Example: dbQuery('SELECT * FROM ambassadors WHERE email = $email LIMIT 1;', { email: 'a@b.com' })
 */
export async function dbQuery<T = unknown>(
  sql: string,
  params?: Record<string, string | number | boolean | null>
): Promise<T[]> {
  const { endpoint } = getConfig();
  let body: string;
  if (params && Object.keys(params).length > 0) {
    const letStatements = Object.entries(params)
      .map(([key, val]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "");
        if (!safeKey) return "";
        return `LET $${safeKey} = ${toSurrealLiteral(val)};`;
      })
      .filter(Boolean);
    body = letStatements.join("\n") + "\n" + sql;
  } else {
    body = sql;
  }
  console.log("[DB] Executing SQL:", body.substring(0, 200));

  const response = await fetch(`${endpoint}/sql`, {
    method: "POST",
    headers: getHeaders(true),
    body,
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
