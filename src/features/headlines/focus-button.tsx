import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { colors } from './styles';

export function FocusButton({ style, ...props }: PressableProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...props}
      focusable={!props.disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        focused && { outlineColor: colors.ink, outlineWidth: 3, outlineOffset: 1, outlineStyle: 'solid' },
      ]}
    />
  );
}
