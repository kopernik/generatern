import { useWindowDimensions } from 'react-native';

export function useWideLayout() {
  return useWindowDimensions().width >= 720;
}
