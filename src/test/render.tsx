import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, type ReactNode } from "react";

/** Fresh query client per test: no retries (failures surface immediately), no cache sharing. */
const makeTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

export const renderWithProviders = (ui: ReactElement, options?: RenderOptions) => {
  const queryClient = makeTestQueryClient();
  const Wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { user: userEvent.setup(), queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
};
