/** Random id for locally created records. `crypto.randomUUID` needs a secure context (https/localhost). */
export const createId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
