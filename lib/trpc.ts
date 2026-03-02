import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (url) {
    return url;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async fetch(url, options) {
        const response = await globalThis.fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok && !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[tRPC] Non-JSON error response:', response.status, text.substring(0, 200));
          throw new Error('Sunucu hatası. Lütfen tekrar deneyin.');
        }
        return response;
      },
    }),
  ],
});
