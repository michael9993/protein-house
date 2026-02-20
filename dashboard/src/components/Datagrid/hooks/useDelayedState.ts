import { useEffect, useState } from "react";

const TRANSITION_DURATION = 300;

export const useDelayedState = (state: boolean) => {
  const [delayedState, setDelayedState] = useState(state);

  useEffect(() => {
    const delay = state ? 0 : TRANSITION_DURATION;
    const timeout = setTimeout(() => {
      setDelayedState(state);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [state]);

  return { delayedState, duration: TRANSITION_DURATION };
};
