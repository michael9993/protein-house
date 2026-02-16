import { useApolloClient } from "@apollo/client";
import { useChannelCurrenciesQuery } from "@dashboard/graphql";
import { renderHook } from "@testing-library/react-hooks";

import { useChannelCurrenciesWithCache } from "./useChannelCurrenciesWithCache";

vi.mock("@apollo/client", () => ({
  useApolloClient: vi.fn(),
}));

vi.mock("@dashboard/graphql", () => ({
  useChannelCurrenciesQuery: vi.fn(),
  ChannelCurrenciesDocument: {},
}));

describe("useChannelCurrenciesWithCache", () => {
  const mockClient = {
    readQuery: vi.fn(),
  };

  const mockQueryResult = {
    data: { shop: { channelCurrencies: ["USD", "EUR"] } },
    loading: false,
    error: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApolloClient).mockReturnValue(mockClient);
    useChannelCurrenciesQuery.mockReturnValue(mockQueryResult);
  });

  it("should use cached data when available and skip query", () => {
    const cachedData = { shop: { channelCurrencies: ["USD", "EUR", "GBP"] } };

    mockClient.readQuery.mockReturnValue(cachedData);

    const { result } = renderHook(() => useChannelCurrenciesWithCache());

    expect(mockClient.readQuery).toHaveBeenCalledWith({
      query: {},
      variables: {},
    });

    expect(useChannelCurrenciesQuery).toHaveBeenCalledWith({
      skip: true,
    });

    expect(result.current.loadingChannelCurrencies).toBe(false);
    expect(result.current.channelCurrencies).toEqual(["USD", "EUR", "GBP"]);
  });

  it("should execute query when no cached data is available", () => {
    mockClient.readQuery.mockImplementation(() => {
      throw new Error("Cache miss");
    });

    renderHook(() => useChannelCurrenciesWithCache());

    expect(useChannelCurrenciesQuery).toHaveBeenCalledWith({
      skip: false,
    });
  });

  it("should handle loading state for gift card forms", () => {
    mockClient.readQuery.mockImplementation(() => {
      throw new Error("Cache miss");
    });

    useChannelCurrenciesQuery.mockReturnValue({
      ...mockQueryResult,
      loading: true,
      data: undefined,
    });

    const { result } = renderHook(() => useChannelCurrenciesWithCache());

    expect(result.current.loadingChannelCurrencies).toBe(true);
    expect(result.current.channelCurrencies).toEqual([]);
  });

  it("should handle error state appropriately", () => {
    mockClient.readQuery.mockImplementation(() => {
      throw new Error("Cache miss");
    });

    const errorResult = {
      ...mockQueryResult,
      loading: false,
      error: new Error("Network error"),
      data: undefined,
    };

    useChannelCurrenciesQuery.mockReturnValue(errorResult);

    const { result } = renderHook(() => useChannelCurrenciesWithCache());

    expect(result.current.loadingChannelCurrencies).toBe(false);
    expect(result.current.channelCurrencies).toEqual([]);
  });

  it("should return query data when cache miss occurs", () => {
    mockClient.readQuery.mockImplementation(() => {
      throw new Error("Cache miss");
    });

    const { result } = renderHook(() => useChannelCurrenciesWithCache());

    expect(result.current.loadingChannelCurrencies).toBe(false);
    expect(result.current.channelCurrencies).toEqual(["USD", "EUR"]);
  });
});
