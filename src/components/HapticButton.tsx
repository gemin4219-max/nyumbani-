/**
 * HapticButton — Drop-in replacement for TouchableOpacity.
 * Fires haptic feedback on EVERY press automatically.
 * Use `hapticType` prop to control intensity.
 */
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import {
  hapticHeavy,
  hapticMedium,
  hapticLight,
  hapticSuccess,
  hapticError,
  hapticSelection,
} from '@/lib/haptics';

type HapticType = 'heavy' | 'medium' | 'light' | 'success' | 'error' | 'selection';

interface HapticButtonProps extends TouchableOpacityProps {
  hapticType?: HapticType;
}

const fireHaptic = (type: HapticType) => {
  switch (type) {
    case 'heavy':     return hapticHeavy();
    case 'light':     return hapticLight();
    case 'success':   return hapticSuccess();
    case 'error':     return hapticError();
    case 'selection': return hapticSelection();
    case 'medium':
    default:          return hapticMedium();
  }
};

export function HapticButton({
  hapticType = 'medium',
  onPress,
  children,
  ...rest
}: HapticButtonProps) {
  const handlePress = (e: any) => {
    fireHaptic(hapticType);
    onPress?.(e);
  };

  return (
    <TouchableOpacity activeOpacity={0.75} {...rest} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
}
