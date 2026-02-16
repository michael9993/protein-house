import { useAppFailedPendingWebhooksLazyQuery } from "@dashboard/graphql";
import { useHasManagedAppsPermission } from "@dashboard/hooks/useHasManagedAppsPermission";
import { renderHook } from "@testing-library/react-hooks";

import { useAppsFailedDeliveries } from "./useAppsFailedDeliveries";

vi.mock("@dashboard/hooks/useHasManagedAppsPermission");
vi.mock("@dashboard/graphql");

const fetchingFunction = vi.fn();

const hasPermissions = {
  hasManagedAppsPermission: true,
};

const doesntHavePermissions = {
  hasManagedAppsPermission: false,
};

describe("useAppsFailedDeliveries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle null webhook data", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: null,
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(result.current.hasFailed).toEqual(false);
  });

  it("should return hasFailed: false when user has no permissions", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(doesntHavePermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      { data: null },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(result.current.hasFailed).toEqual(false);
  });

  it("should not flag as fails if there are no failed webhooks", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [] },
                      pendingDelivers: {
                        edges: [],
                      },
                    },
                    {
                      failedDelivers: { edges: [] },
                      pendingDelivers: { edges: [] },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(fetchingFunction).toHaveBeenCalled();
    expect(result.current.hasFailed).toEqual(false);
  });

  it("should check webhooks correctly for pending deliveries when user has permissions", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-19T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      failedDelivers: { edges: [] },
                      pendingDelivers: null,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(fetchingFunction).toHaveBeenCalled();
    expect(result.current.hasFailed).toEqual(true);
  });

  it("should check webhooks correctly when user has permissions", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [1, 2] },
                      pendingDelivers: [],
                    },
                    {
                      failedDelivers: null,
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-19T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(fetchingFunction).toHaveBeenCalled();
    expect(result.current.hasFailed).toEqual(true);
  });

  it("should check webhooks correctly for both delivery fail types", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [1, 2] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-19T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(fetchingFunction).toHaveBeenCalled();
    expect(result.current.hasFailed).toEqual(true);
  });

  it("should return null for lastFailedWebhookDate when there are no webhooks", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(result.current.lastFailedWebhookDate).toBeNull();
  });

  it("should return the latest failed webhook date", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [1] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-19T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      failedDelivers: { edges: [2] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-20T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(result.current.lastFailedWebhookDate?.toISOString()).toEqual("2023-01-20T09:50:43.343Z");
  });

  it("should return the latest failed webhook date when some webhooks have no failed deliveries", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-19T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      failedDelivers: { edges: [2] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-20T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(result.current.lastFailedWebhookDate?.toISOString()).toEqual("2023-01-20T09:50:43.343Z");
  });

  it("should should handle multiple apps with failed events", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue(hasPermissions);
    vi.mocked(useAppFailedPendingWebhooksLazyQuery).mockReturnValue([
      fetchingFunction,
      {
        data: {
          apps: {
            edges: [
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [1] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-19T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      failedDelivers: { edges: [2] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-20T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                node: {
                  webhooks: [
                    {
                      failedDelivers: { edges: [1] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-21T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      failedDelivers: { edges: [2] },
                      pendingDelivers: {
                        edges: [
                          {
                            node: {
                              attempts: {
                                edges: [
                                  {
                                    node: {
                                      status: "FAILED",
                                      createdAt: "2023-01-20T09:50:43.343Z",
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                node: {
                  webhooks: [],
                },
              },
            ],
          },
        },
      },
    ]);

    // Act
    const { result } = renderHook(() => useAppsFailedDeliveries());

    result.current.fetchAppsWebhooks();

    // Assert
    expect(result.current.lastFailedWebhookDate?.toISOString()).toEqual("2023-01-21T09:50:43.343Z");
  });
});
