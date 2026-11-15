import { setupServer } from "msw/node";

/** Shared MSW server; tests add handlers with `server.use(...)` (reset after each test). */
export const server = setupServer();
