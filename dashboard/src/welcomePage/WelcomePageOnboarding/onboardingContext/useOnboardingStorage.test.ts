import { useUser } from "@dashboard/auth";
import { useSaveOnBoardingStateMutation } from "@dashboard/graphql";
import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";

import { OnboardingStepsIDs } from "./types";
import { useOnboardingStorage } from "./useOnboardingStorage";

vi.mock("@dashboard/auth", () => ({
  __esModule: true,
  useUser: vi.fn(),
}));

vi.mock("@dashboard/graphql");

vi.useFakeTimers();

vi.mock("lodash/debounce", () => vi.fn(fn => fn));

describe("useOnboardingStorage", () => {
  describe("getOnboardingState", () => {
    it("should return undefined when there is no onboarding in user metadata", () => {
      // Arrange
      vi.mocked(useUser).mockImplementation(() => ({
        user: { metadata: [{ key1: "value1" }, { key2: "value2" }] },
      }));
      vi.mocked(useSaveOnBoardingStateMutation).mockReturnValue([vi.fn(), {}]);

      const { getOnboardingState } = renderHook(() => useOnboardingStorage()).result.current;

      // Act
      const result = getOnboardingState();

      // Assert
      expect(result).toBeUndefined();
    });

    it("should return onboarding state from user metadata", () => {
      // Arrange
      vi.mocked(useUser).mockImplementation(() => ({
        user: {
          metadata: [
            {
              key: "onboarding",
              value: JSON.stringify({ steps: [], onboardingExpanded: true }),
            },
          ],
        },
      }));
      vi.mocked(useSaveOnBoardingStateMutation).mockReturnValue([vi.fn(), {}]);

      const { getOnboardingState } = renderHook(() => useOnboardingStorage()).result.current;

      // Act
      const result = getOnboardingState();

      // Assert
      expect(result).toEqual({ steps: [], onboardingExpanded: true });
    });
  });

  describe("saveOnboardingState", () => {
    it("should not save onboarding state when there is no user", async () => {
      // Arrange
      vi.mocked(useUser).mockImplementation(() => ({ user: null }));

      const updateMetadataMock = vi.fn();

      vi.mocked(useSaveOnBoardingStateMutation).mockReturnValue([updateMetadataMock, {}]);

      const { result } = renderHook(() => useOnboardingStorage());

      // Act
      const returnValue = await act(async () => {
        return await result.current.saveOnboardingState({
          stepsCompleted: [],
          stepsExpanded: {} as Record<OnboardingStepsIDs, boolean>,
          onboardingExpanded: true,
        });
      });

      // Assert
      expect(returnValue).toBeUndefined();
      expect(updateMetadataMock).not.toHaveBeenCalled();
    });

    it("should save onboarding state to user metadata and be called only once", async () => {
      // Arrange
      vi.mocked(useUser).mockImplementation(() => ({ user: { id: "1", metadata: [] } }));

      const updateMetadataMock = vi.fn();

      vi.mocked(useSaveOnBoardingStateMutation).mockReturnValue([updateMetadataMock, {}]);

      const { result } = renderHook(() => useOnboardingStorage());

      // Act
      await act(async () => {
        await result.current.saveOnboardingState({
          stepsCompleted: [],
          stepsExpanded: {} as Record<OnboardingStepsIDs, boolean>,
          onboardingExpanded: true,
        });
      });

      vi.runAllTimers();

      // Assert
      expect(updateMetadataMock).toHaveBeenCalledTimes(1);
      expect(updateMetadataMock).toHaveBeenCalledWith({
        variables: {
          id: "1",
          input: [
            {
              key: "onboarding",
              value: JSON.stringify({
                stepsCompleted: [],
                stepsExpanded: {} as Record<OnboardingStepsIDs, boolean>,
                onboardingExpanded: true,
              }),
            },
          ],
        },
      });
    });
  });
});
