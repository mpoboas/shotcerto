export const TARGET_MIN_SECONDS = 0.5;
export const TARGET_MAX_SECONDS = 10;
export const TARGET_STEP_SECONDS = 0.5;

export function snapTargetSeconds(value: number): number {
  const snapped =
    Math.round(value / TARGET_STEP_SECONDS) * TARGET_STEP_SECONDS;
  return Math.min(
    TARGET_MAX_SECONDS,
    Math.max(TARGET_MIN_SECONDS, snapped),
  );
}
