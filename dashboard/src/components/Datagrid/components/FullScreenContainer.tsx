// @ts-strict-ignore
import { CSSProperties, FC, PropsWithChildren } from "react";
import ReactDOM from "react-dom";

import { useDelayedState } from "../hooks/useDelayedState";

const modalRoot = document.getElementById("modal-root") || document.createElement("div");
const useEase = (duration: number) => {
  const transitionIn = `all ${duration}ms cubic-bezier(0.4, 0, 1, 1) 0ms`;
  const transitionOut = `all ${duration}ms cubic-bezier(0.0, 0, 0.2, 1) 0ms`;

  return { transitionIn, transitionOut };
};
const useAnimationStyles = (isOpen: boolean, duration: number) => {
  const { transitionIn, transitionOut } = useEase(duration);
  const initialStyles: CSSProperties = {
    opacity: 0,
    position: "fixed",
    inset: 0,
    zIndex: -1,
  };
  const openStyles = {
    transition: transitionIn,
    opacity: 1,
    zIndex: 1,
  };
  const closedStyles = {
    transition: transitionOut,
    opacity: 0,
  };

  return {
    ...initialStyles,
    ...(isOpen ? openStyles : closedStyles),
  };
};

type FullScreenContainerProps = FC<
  PropsWithChildren<{
    open?: boolean;
    className?: string;
  }>
>;

const Portal: FullScreenContainerProps = ({ className, children, open }) => {
  const { delayedState: delayedOpen, duration } = useDelayedState(open);
  const styles = useAnimationStyles(open, duration);

  return ReactDOM.createPortal(
    <div className={className} style={styles}>
      {delayedOpen && children}
    </div>,
    modalRoot,
  );
};

export const FullScreenContainer: FullScreenContainerProps = ({ children, ...rest }) => (
  <>
    <Portal {...rest}>{children}</Portal>
    {children}
  </>
);
