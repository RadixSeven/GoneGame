import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { lognormal_sample, randomOverlappingPosition } from "./goneGameAPI";
import * as R from "ramda";
import RG from "ramda-generators";

export const imageWidth = 88;
export const viewportWidth = 500;

/**
 * Properties of an image - all times in milliseconds
 */
export interface ImageProps {
  /**
   * Must be non-negative
   */
  timeToStartFadeIn: number;
  /**
   * Greater than timeToStartFadeIn
   */
  timeToFinishFadeIn: number;
  /**
   * Greater than timeToFinishFadeIn
   */
  timeToDisappear: number;
  /**
   * Horizontal location for upper left hand corner of image
   */
  x: number;
  /**
   * Key for rendering
   */
  key: number;
}

export interface BoundedLogNormalParams {
  min: number;
  mean: number;
  std: number;
}

export interface GenerationParams {
  timeBetweenDisappearances: BoundedLogNormalParams;
  fadeInTime: BoundedLogNormalParams;
  opaqueTime: BoundedLogNormalParams;
}

export interface GameState {
  simulationIsRunning: boolean;
  currentTime: number;
  images: ImageProps[];
  generationParams: GenerationParams;
}

const initialState: GameState = {
  simulationIsRunning: true,
  currentTime: 0,
  images: [],
  generationParams: {
    timeBetweenDisappearances: { min: 100, mean: 900, std: 1000 },
    fadeInTime: { min: 400, mean: 600, std: 200 },
    opaqueTime: { min: 0, mean: 200, std: 200 },
  },
};

export function roundToNearest(granularity: number) {
  return (toRound: number) => granularity * Math.round(toRound / granularity);
}
export const tickInterval = 50;
const roundToTick = roundToNearest(tickInterval);

function intSampleFromBoundedLognormal(params: BoundedLogNormalParams) {
  return roundToTick(params.min + lognormal_sample(params.mean, params.std));
}

/**
 * List of images appearing at or after currentTime that disappear after lastImage.
 *
 * Images are generated in order of disappearance and overlap with the previous to disappear
 * @param currentTime
 * @param lastImage
 * @param gp
 */
function* newImagesDisappearingAfter(
  currentTime: number,
  lastImage: ImageProps,
  gp: GenerationParams
) {
  function goodDeltas(disappear: number, opaque: number, fade: number) {
    const newFadeInTime = lastImage.timeToDisappear + disappear - opaque - fade;
    return newFadeInTime >= currentTime;
  }
  function imageFromDeltas(
    disappear: number,
    opaque: number,
    fade: number,
    lastImageDisappear: number,
    lastImageKey: number,
    lastImageX: number
  ): ImageProps {
    const disTime = lastImageDisappear + disappear;
    return {
      timeToStartFadeIn: disTime - opaque - fade,
      timeToFinishFadeIn: disTime - opaque,
      timeToDisappear: disTime,
      x: randomOverlappingPosition(lastImageX, imageWidth, viewportWidth),
      key: lastImageKey + 1,
    };
  }
  const maxTries = 20;
  while (true) {
    let foundGoodDeltas = false;
    for (let i = 0; i < maxTries; ++i) {
      const disappearDelta = intSampleFromBoundedLognormal(
        gp.timeBetweenDisappearances
      );
      const opaqueDelta = intSampleFromBoundedLognormal(gp.opaqueTime);
      const fadeDelta = intSampleFromBoundedLognormal(gp.fadeInTime);
      if (goodDeltas(disappearDelta, opaqueDelta, fadeDelta)) {
        lastImage = imageFromDeltas(
          disappearDelta,
          opaqueDelta,
          fadeDelta,
          lastImage.timeToDisappear,
          lastImage.key,
          lastImage.x
        );
        foundGoodDeltas = true;
        break;
      }
    }
    if (!foundGoodDeltas) {
      lastImage = imageFromDeltas(
        1000,
        500,
        500,
        lastImage.timeToDisappear,
        lastImage.key,
        lastImage.x
      );
    }
    yield lastImage;
  }
}

/**
 * Return a copy of images which is ready for the next tick
 *
 * It has at least one image that hasn't started to fade in yet
 * It has no images that have disappeared
 * The images are sorted in order of disappearance so that the
 * last image to disappear is last in the list
 *
 * @param currentTime The current time (in milliseconds)
 * @param images The image properties to adjust
 * @param generationParams The parameters describing the distribution of new images
 */
function fillUpImages(
  currentTime: number,
  images: ImageProps[],
  generationParams: GenerationParams
): ImageProps[] {
  function notDisappeared(i: ImageProps) {
    return currentTime < i.timeToDisappear;
  }
  function withinFiveSecondBuffer(i: ImageProps) {
    return i.timeToDisappear <= currentTime + 5000;
  }
  const withoutDisappeared = R.filter(notDisappeared, images);
  const sortedByDisappearance = R.sortBy<ImageProps>(
    R.prop("timeToDisappear"),
    withoutDisappeared
  );
  const lastDisappears = R.last(sortedByDisappearance);
  const finalImage = lastDisappears
    ? lastDisappears
    : {
        timeToStartFadeIn: currentTime,
        timeToFinishFadeIn: currentTime + 400,
        timeToDisappear: currentTime + 1400,
        x: 0,
        key: 0,
      };

  const newImages = RG.takeAll(
    RG.takeWhile(
      withinFiveSecondBuffer,
      newImagesDisappearingAfter(currentTime, finalImage, generationParams)
    )
  );
  return R.concat(sortedByDisappearance, newImages);
}

/**
 * Return the time until the next event after currentTime (in milliseconds)
 *
 * If there are no events after the current time, returns Infinity
 * @param currentTime The current time
 * @param images The images that are changing
 */
function timeOfNextEvent(currentTime: number, images: ImageProps[]): number {
  function getTimes(i: ImageProps) {
    return [i.timeToDisappear, i.timeToFinishFadeIn, i.timeToStartFadeIn];
  }

  function isLater(t: number) {
    return t > currentTime;
  }

  const getEarliestTime = R.pipe(
    R.chain(getTimes),
    R.filter(isLater),
    R.reduce<number, number>(R.min, Infinity)
  );
  return getEarliestTime(images);
}

export const goneGameDisplaySlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    clickedPlayButton: (state) => {
      state.simulationIsRunning = true;
    },
    clickedPauseButton: (state) => {
      state.simulationIsRunning = false;
    },
    timerTicked: (state, action: PayloadAction<number>) => {
      state.currentTime += action.payload;
      const nextEvent = timeOfNextEvent(state.currentTime - 1, state.images);
      if (nextEvent === Infinity || nextEvent === state.currentTime) {
        state.images = fillUpImages(
          state.currentTime,
          state.images,
          state.generationParams
        );
      }
    },
    timerStarted: (state) => {
      state.currentTime = 0;
      state.simulationIsRunning = true;
      state.images = [];
    },
    timerStopped: (state) => {
      state.simulationIsRunning = false;
    },
  },
});

export const {
  clickedPlayButton,
  clickedPauseButton,
  timerTicked,
  timerStarted,
  timerStopped,
} = goneGameDisplaySlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useAppSelector((state: RootState) => state.goneGameDisplay.value)`

export const getSimulationIsRunning = (state: RootState) =>
  state.goneGameDisplay.simulationIsRunning;

export const getImages = (state: RootState) => state.goneGameDisplay.images;

export const getCurrentTime = (state: RootState) =>
  state.goneGameDisplay.currentTime;

export default goneGameDisplaySlice.reducer;
