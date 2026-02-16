import { PermissionEnum } from "@dashboard/graphql";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useAppPermissionsDialogState } from "./AppPermissionsDialogState";

describe("useAppPermissionsDialogState", () => {
  it("Creates state with initial permissions - empty", () => {
    const { result } = renderHook(() => useAppPermissionsDialogState([]));

    expect(result.current.state.type).toEqual("pick-permissions");
    expect(result.current.state.selected).toEqual([]);
  });
  it("Creates state with initial permissions", () => {
    const { result } = renderHook(() =>
      useAppPermissionsDialogState([PermissionEnum.MANAGE_CHANNELS, PermissionEnum.MANAGE_ORDERS]),
    );

    expect(result.current.state.type).toEqual("pick-permissions");
    expect(result.current.state.selected).toEqual(["MANAGE_CHANNELS", "MANAGE_ORDERS"]);
  });
  describe("Transitions to confirmation screen with proper diff", () => {
    test("One added permission", async () => {
      const { result } = renderHook(() =>
        useAppPermissionsDialogState([
          PermissionEnum.MANAGE_CHANNELS,
          PermissionEnum.MANAGE_ORDERS,
        ]),
      );

      act(() => {
        result.current.updateSelected([
          PermissionEnum.MANAGE_CHANNELS,
          PermissionEnum.MANAGE_ORDERS,
          PermissionEnum.HANDLE_CHECKOUTS,
        ]);
      });

      act(() => {
        result.current.onConfirmSelection();
      });

      await waitFor(() => {
        expect(result.current.state.type).toEqual("confirm-permissions");

        if (result.current.state.type === "confirm-permissions") {
          expect(result.current.state.removedPermissions).toEqual([]);
          expect(result.current.state.addedPermissions).toEqual(["HANDLE_CHECKOUTS"]);
        } else {
          throw new Error();
        }
      });
    });
    test("One removed permission", async () => {
      const { result } = renderHook(() =>
        useAppPermissionsDialogState([
          PermissionEnum.MANAGE_CHANNELS,
          PermissionEnum.MANAGE_ORDERS,
        ]),
      );

      act(() => {
        result.current.updateSelected([PermissionEnum.MANAGE_CHANNELS]);
      });

      act(() => {
        result.current.onConfirmSelection();
      });

      await waitFor(() => {
        expect(result.current.state.type).toEqual("confirm-permissions");

        if (result.current.state.type === "confirm-permissions") {
          expect(result.current.state.removedPermissions).toEqual(["MANAGE_ORDERS"]);
          expect(result.current.state.addedPermissions).toEqual([]);
        } else {
          throw new Error();
        }
      });
    });
    test("One added and one removed permission", async () => {
      const { result } = renderHook(() =>
        useAppPermissionsDialogState([
          PermissionEnum.MANAGE_CHANNELS,
          PermissionEnum.MANAGE_ORDERS,
        ]),
      );

      act(() => {
        result.current.updateSelected([PermissionEnum.MANAGE_CHANNELS, PermissionEnum.MANAGE_CHECKOUTS]);
      });

      act(() => {
        result.current.onConfirmSelection();
      });

      await waitFor(() => {
        expect(result.current.state.type).toEqual("confirm-permissions");

        if (result.current.state.type === "confirm-permissions") {
          expect(result.current.state.removedPermissions).toEqual(["MANAGE_ORDERS"]);
          expect(result.current.state.addedPermissions).toEqual(["MANAGE_CHECKOUTS"]);
        } else {
          throw new Error();
        }
      });
    });
  });
});
