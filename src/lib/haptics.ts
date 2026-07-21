import * as Haptics from 'expo-haptics';

/**
 * Strong heavy impact — for main buttons, CTAs, Add to Cart, Confirm actions
 */
export const hapticHeavy = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Medium impact — for tab bar navigation, card presses, toggles
 */
export const hapticMedium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Light impact — for minor interactions, scroll taps, dismiss
 */
export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Success notification — for booking confirmed, payment success, cart added
 */
export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Error notification — for form errors, payment failed
 */
export const hapticError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Warning notification — for alerts, low balance warnings
 */
export const hapticWarning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Selection changed — for radio buttons, filter chips, toggles
 */
export const hapticSelection = () => {
  Haptics.selectionAsync();
};
