// @ts-strict-ignore

const Container = ({ children }) => {
  return !!children.length && (
    <div className="grid justify-end right-0 pointer-events-auto fixed top-0 w-auto max-h-screen overflow-y-auto z-[10000]">
      {children}
    </div>
  );
};

export default Container;
