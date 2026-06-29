import apiConfig from "./api.json";

export type ApiEndpointKey = keyof typeof apiConfig.endpoints;

export const baseUrl = apiConfig.baseUrl;
export const tokenStorageKey = apiConfig.tokenStorageKey;
export const defaultHeaders = apiConfig.defaultHeaders;
export const endpoints = apiConfig.endpoints;

export function normalizePath(path = ""): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function url(path = ""): string {
  return `${baseUrl}${normalizePath(path)}`;
}

export function endpointUrl(endpoint: ApiEndpointKey, path = ""): string {
  return url(`${endpoints[endpoint]}${normalizePath(path)}`);
}

export function buildHeaders(extraHeaders: Record<string, string> = {}, token?: string) {
  const headers = { ...defaultHeaders, ...extraHeaders };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function tokenHeader(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
