import type { Plugin } from "vite";

type PageRequest = { url?: string };
type PageResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(): void;
};
type Next = () => void;
type Handler = (
  request: PageRequest,
  response: PageResponse,
  next: Next,
) => void;

const ALIAS_PATH = "/leave-the-door-open";
const CANONICAL_PATH = "/leave-the-door-open/";

export const createLeaveDoorOpenPageRouteMiddleware = (): Handler =>
  (request, response, next): void => {
    const [path, query] = (request.url ?? "").split("?", 2);
    if (path !== ALIAS_PATH) {
      next();
      return;
    }
    response.statusCode = 308;
    response.setHeader(
      "location",
      query ? `${CANONICAL_PATH}?${query}` : CANONICAL_PATH,
    );
    response.end();
  };

export const leaveDoorOpenPageRoutePlugin = (): Plugin => {
  const handler = createLeaveDoorOpenPageRouteMiddleware();
  const install = (middlewares: { use(handler: Handler): void }): void => {
    middlewares.use(handler);
  };
  return {
    name: "leave-door-open-page-route",
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
};
