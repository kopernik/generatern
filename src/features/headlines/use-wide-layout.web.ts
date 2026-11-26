import { useSyncExternalStore } from 'react';

const query = '(min-width: 720px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

// The server and the first hydration render both use the compact layout.
export function useWideLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
