import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

interface LocationLike {
  pathname: string;
  search: string;
}

const compareLocations = (a: LocationLike, b: LocationLike) => {
  return a.pathname === b.pathname && a.search === b.search;
};

export const useRouteChange = (onChange: (location: LocationLike) => void) => {
  const location = useLocation();
  const prevLocation = useRef<LocationLike>(location);
  const registered = useRef(false);

  const register = () => {
    if (registered.current) return;
    registered.current = true;
    // Fire immediately with current location
    onChange(location);
  };

  useEffect(() => {
    if (!registered.current) return;

    if (!compareLocations(prevLocation.current, location)) {
      onChange(location);
      prevLocation.current = location;
    }
  }, [location, onChange]);

  return { register };
};
