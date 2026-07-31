import { useCallback } from 'react';
import { createPath, useLocation, useNavigate, type To } from 'react-router-dom';

export function useAppBack(fallbackTo: To) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const currentRoute = `${location.pathname}${location.search}${location.hash}`;
    const routeState = location.state && typeof location.state === 'object'
      ? location.state as Record<string, unknown>
      : {};
    const previousRoute = typeof routeState.from === 'string' ? routeState.from : null;
    const backTrail = Array.isArray(routeState.__uiBackTrail)
      ? routeState.__uiBackTrail.filter((route): route is string => typeof route === 'string')
      : [];
    const fallbackRoute = typeof fallbackTo === 'string' ? fallbackTo : createPath(fallbackTo);
    const safeFallback = fallbackRoute === currentRoute || backTrail.includes(fallbackRoute)
      ? '/'
      : fallbackRoute;
    const candidate = previousRoute && previousRoute !== currentRoute && !backTrail.includes(previousRoute)
      ? previousRoute
      : safeFallback;
    const destination = candidate === currentRoute || backTrail.includes(candidate)
      ? safeFallback
      : candidate;
    const { from: _from, __uiBackTrail: _trail, ...preservedState } = routeState;

    navigate(destination === currentRoute ? '/' : destination, {
      replace: true,
      state: {
        ...preservedState,
        __uiBackTrail: [...backTrail, currentRoute].slice(-20),
      },
    });
  }, [fallbackTo, location.hash, location.pathname, location.search, location.state, navigate]);
}