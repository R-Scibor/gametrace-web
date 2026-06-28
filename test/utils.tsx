import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/authStore';
import { useToastStore } from '../src/store/toastStore';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function resetStores() {
  useAuthStore.getState().logout();
  useToastStore.setState({ toasts: [] });
}

export function seedAuth() {
  useAuthStore.getState().login('test-token', {
    discordId: '123',
    username: 'testuser',
  });
}

interface RenderOptions {
  route?: string;
  authenticated?: boolean;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', authenticated = false, queryClient }: RenderOptions = {},
) {
  if (authenticated) {
    seedAuth();
  } else {
    useAuthStore.getState().logout();
  }

  const client = queryClient ?? createTestQueryClient();

  return {
    queryClient: client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

export function renderPage(
  page: React.ReactElement,
  { route = '/', authenticated = true, queryClient }: RenderOptions = {},
) {
  return renderWithProviders(page, { route, authenticated, queryClient });
}

export function renderHookWithProviders<T>(hook: () => T, queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return renderHook(hook, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

export function renderAppRoutes(
  routes: React.ReactNode,
  { route = '/', authenticated = true }: RenderOptions = {},
) {
  if (authenticated) seedAuth();
  const client = createTestQueryClient();
  return {
    queryClient: client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>{routes}</Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}