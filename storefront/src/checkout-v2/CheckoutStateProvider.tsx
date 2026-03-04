"use client";

import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";
import type {
	CheckoutState,
	CheckoutAction,
	StepIndex,
	MutatingScope,
} from "./types";

// --- Reducer ---

const initialState: CheckoutState = {
	checkout: null,
	activeStep: 0,
	completedSteps: new Set(),
	mutating: null,
	stepErrors: new Map(),
	billingMatchesShipping: true,
	selectedBillingId: null,
	billingDefaults: {},
	optimisticLines: new Map(),
};

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
	switch (action.type) {
		case "SET_CHECKOUT":
			return {
				...state,
				checkout: action.checkout,
				// Clear optimistic updates when server responds
				optimisticLines: new Map(),
			};

		case "OPEN_STEP": {
			// Only allow opening steps that are unlocked (all previous steps completed)
			const canOpen = Array.from({ length: action.step }, (_, i) => i).every((i) =>
				state.completedSteps.has(i),
			);
			if (!canOpen && action.step > 0) return state;
			return { ...state, activeStep: action.step };
		}

		case "COMPLETE_STEP": {
			const next = new Set(state.completedSteps);
			next.add(action.step);
			return { ...state, completedSteps: next };
		}

		case "UNCOMPLETE_STEP": {
			const next = new Set(state.completedSteps);
			next.delete(action.step);
			return { ...state, completedSteps: next };
		}

		case "SET_MUTATING":
			return { ...state, mutating: action.scope };

		case "SET_STEP_ERRORS": {
			const next = new Map(state.stepErrors);
			next.set(action.step, action.errors);
			return { ...state, stepErrors: next };
		}

		case "CLEAR_STEP_ERRORS": {
			const next = new Map(state.stepErrors);
			next.delete(action.step);
			return { ...state, stepErrors: next };
		}

		case "SET_BILLING_MATCHES_SHIPPING":
			return { ...state, billingMatchesShipping: action.matches };

		case "SET_SELECTED_BILLING_ID":
			return { ...state, selectedBillingId: action.id };

		case "SET_BILLING_DEFAULTS":
			return { ...state, billingDefaults: action.defaults };

		case "OPTIMISTIC_QUANTITY": {
			const next = new Map(state.optimisticLines);
			next.set(action.lineId, { quantity: action.quantity });
			return { ...state, optimisticLines: next };
		}

		case "OPTIMISTIC_REMOVE_LINE": {
			const next = new Map(state.optimisticLines);
			next.set(action.lineId, "removed");
			return { ...state, optimisticLines: next };
		}

		case "REVERT_OPTIMISTIC":
			return { ...state, optimisticLines: new Map() };

		default:
			return state;
	}
}

// --- Context ---

interface CheckoutContextValue {
	state: CheckoutState;
	dispatch: React.Dispatch<CheckoutAction>;
	/** Convenience: set checkout from a mutation response */
	setCheckout: (checkout: CheckoutFragment) => void;
	/** Convenience: open a specific step */
	openStep: (step: StepIndex) => void;
	/** Convenience: mark step complete and advance to next */
	completeStepAndAdvance: (step: StepIndex) => void;
	/** Convenience: set mutating scope */
	setMutating: (scope: MutatingScope) => void;
	/** Convenience: set errors for a step */
	setStepErrors: (step: StepIndex, errors: string[]) => void;
	/** Convenience: clear errors for a step */
	clearStepErrors: (step: StepIndex) => void;
	/** Whether any mutation is in-flight */
	isMutating: boolean;
	/** Get visible lines (applying optimistic updates) */
	visibleLines: CheckoutFragment["lines"];
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

// --- Provider ---

interface CheckoutStateProviderProps {
	children: ReactNode;
	initialCheckout?: CheckoutFragment | null;
}

export function CheckoutStateProvider({ children, initialCheckout }: CheckoutStateProviderProps) {
	const [state, dispatch] = useReducer(checkoutReducer, {
		...initialState,
		checkout: initialCheckout ?? null,
		// Auto-detect completed steps from initial checkout data
		...(initialCheckout && getInitialStepState(initialCheckout)),
	});

	const setCheckout = useCallback(
		(checkout: CheckoutFragment) => dispatch({ type: "SET_CHECKOUT", checkout }),
		[],
	);

	const openStep = useCallback(
		(step: StepIndex) => dispatch({ type: "OPEN_STEP", step }),
		[],
	);

	const completeStepAndAdvance = useCallback(
		(step: StepIndex) => {
			dispatch({ type: "COMPLETE_STEP", step });
			dispatch({ type: "CLEAR_STEP_ERRORS", step });
			const nextStep = Math.min(step + 1, 3) as StepIndex;
			dispatch({ type: "OPEN_STEP", step: nextStep });
		},
		[],
	);

	const setMutating = useCallback(
		(scope: MutatingScope) => dispatch({ type: "SET_MUTATING", scope }),
		[],
	);

	const setStepErrors = useCallback(
		(step: StepIndex, errors: string[]) => dispatch({ type: "SET_STEP_ERRORS", step, errors }),
		[],
	);

	const clearStepErrors = useCallback(
		(step: StepIndex) => dispatch({ type: "CLEAR_STEP_ERRORS", step }),
		[],
	);

	// Compute visible lines with optimistic updates applied
	const visibleLines = getVisibleLines(state);

	const value: CheckoutContextValue = {
		state,
		dispatch,
		setCheckout,
		openStep,
		completeStepAndAdvance,
		setMutating,
		setStepErrors,
		clearStepErrors,
		isMutating: state.mutating !== null,
		visibleLines,
	};

	return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

// --- Hook ---

export function useCheckoutState() {
	const ctx = useContext(CheckoutContext);
	if (!ctx) {
		throw new Error("useCheckoutState must be used within a CheckoutStateProvider");
	}
	return ctx;
}

// --- Helpers ---

/** Derive initial step completion state from checkout data */
function getInitialStepState(checkout: CheckoutFragment) {
	const completedSteps = new Set<number>();
	let activeStep: StepIndex = 0;

	// Step 0: Contact — complete if email exists
	if (checkout.email) {
		completedSteps.add(0);
		activeStep = 1;
	}

	// Step 1: Shipping — complete if shipping address exists
	if (checkout.shippingAddress) {
		completedSteps.add(1);
		activeStep = 2;
	}

	// Step 2: Delivery — complete if delivery method selected
	if (checkout.deliveryMethod) {
		completedSteps.add(2);
		activeStep = 3;
	}

	return { completedSteps, activeStep };
}

/** Apply optimistic line updates to produce visible lines */
function getVisibleLines(state: CheckoutState): CheckoutFragment["lines"] {
	if (!state.checkout?.lines || state.optimisticLines.size === 0) {
		return state.checkout?.lines ?? [];
	}

	return state.checkout.lines
		.map((line) => {
			const update = state.optimisticLines.get(line.id);
			if (!update) return line;
			if (update === "removed") return null;
			return { ...line, quantity: update.quantity };
		})
		.filter((line): line is NonNullable<typeof line> => line !== null);
}
