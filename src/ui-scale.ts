const BASE_VIEWPORT_WIDTH = 1440;
const BASE_VIEWPORT_HEIGHT = 900;
const MAXIMUM_UI_SCALE = 1.45;

export const calculateUiScale = (viewportWidth: number, viewportHeight: number): number => {
  const proportionalScale = Math.min(
    viewportWidth / BASE_VIEWPORT_WIDTH,
    viewportHeight / BASE_VIEWPORT_HEIGHT,
  );

  return Math.min(MAXIMUM_UI_SCALE, Math.max(1, proportionalScale));
};
