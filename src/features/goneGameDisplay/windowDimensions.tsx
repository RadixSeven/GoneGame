import { useEffect } from "react";
import { AppDispatch } from "../../app/store";
import { windowResized } from "./goneGameDisplaySlice";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

/**
 * Hook for getting window dimensions - fires an event when the window is resized
 *
 * From https://stackoverflow.com/a/36862446/309334
 * Example:
 *
 * const Component = () => {
 *   useWindowDimensions(dispatch);
 *   ...
 * }
 */
export default function useWindowDimensions(dispatch: AppDispatch) {
  useEffect(() => {
    function handleResize() {
      dispatch(windowResized(getWindowDimensions()));
    }

    window.addEventListener("resize", handleResize);
    dispatch(windowResized(getWindowDimensions()));
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
