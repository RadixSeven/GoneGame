import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, AppThunk, RootState } from "../../app/store";
import {
  fetchCount,
  lognormal_sample,
  randomOverlappingPosition,
  waitMilliseconds,
  waitRandomTime,
} from "./counterAPI";
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

export interface CounterState {
  value: number;
  status: "idle" | "loading" | "failed";
  targetIsVisible: boolean;
  simulationIsRunning: boolean;
  currentTime: number;
  images: ImageProps[];
  generationParams: GenerationParams;
}

const initialState: CounterState = {
  value: 0,
  status: "idle",
  targetIsVisible: false,
  simulationIsRunning: true,
  currentTime: 0,
  images: [],
  generationParams: {
    timeBetweenDisappearances: { min: 100, mean: 900, std: 1000 },
    fadeInTime: { min: 400, mean: 600, std: 200 },
    opaqueTime: { min: 0, mean: 200, std: 200 },
  },
};

// The function below is called a thunk and allows us to perform async logic. It
// can be dispatched like a regular action: `dispatch(incrementAsync(10))`. This
// will call the thunk with the `dispatch` function as the first argument. Async
// code can then be executed and other actions can be dispatched. Thunks are
// typically used to make async requests.
export const incrementAsync = createAsyncThunk(
  "counter/fetchCount",
  async (amount: number) => {
    const response = await fetchCount(amount);
    // The value we return becomes the `fulfilled` action payload
    return response.data;
  }
);

function intSampleFromBoundedLognormal(params: BoundedLogNormalParams) {
  return Math.round(params.min + lognormal_sample(params.mean, params.std));
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
    return disappear >= opaque + fade;
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
    return i.timeToDisappear < currentTime;
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
 * @param currentTime The current time
 * @param images The images that are changing
 */
function timeUntilNextEvent(currentTime: number, images: ImageProps[]): number {
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
  return getEarliestTime(images) - currentTime;
}

export const millisecondsPassed = createAsyncThunk<
  { newImages: ImageProps[]; newTime: number },
  { numMs: number },
  { dispatch: AppDispatch; state: RootState }
>("counter/millisecondsPassed", async (arg: { numMs: number }, thunkAPI) => {
  await waitMilliseconds(arg.numMs);
  const newTime = arg.numMs + getCurrentTime(thunkAPI.getState());
  const gp = getGenerationParams(thunkAPI.getState());
  const newImages = fillUpImages(newTime, getImages(thunkAPI.getState()), gp);
  thunkAPI.dispatch(
    millisecondsPassed({ numMs: timeUntilNextEvent(newTime, newImages) })
  );
  return { newImages: newImages, newTime: newTime };
});

export const autoIncrement2 = createAsyncThunk(
  "counter/autoIncrement",
  async (arg: { amount: number; numTimes: number }, thunkAPI) => {
    await waitRandomTime(3000, 3000, 3000);
    if (arg.numTimes >= 2) {
      thunkAPI.dispatch(
        autoIncrement2({ amount: arg.amount, numTimes: arg.numTimes - 1 })
      );
    }
    return arg;
  }
);

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    clickedPlayButton: (state) => {
      state.simulationIsRunning = true;
    },
    clickedPauseButton: (state) => {
      state.simulationIsRunning = false;
    },
    timerTicked: (state, action: PayloadAction<number>) => {
      state.currentTime += action.payload;
    },
    timerStarted: (state) => {
      state.currentTime = 0;
      state.images = [];
    },
    timerStopped: () => {},
  },
  // The `extraReducers` field lets the slice handle actions defined elsewhere,
  // including actions generated by createAsyncThunk or in other slices.
  extraReducers: (builder) => {
    builder
      .addCase(incrementAsync.pending, (state) => {
        state.status = "loading";
      })
      .addCase(incrementAsync.fulfilled, (state, action) => {
        state.status = "idle";
        state.value += action.payload;
      })
      .addCase(autoIncrement2.pending, () => {})
      .addCase(autoIncrement2.fulfilled, (state, action) => {
        state.targetIsVisible = !state.targetIsVisible;
        if (action.payload.numTimes >= 1) {
          state.value += action.payload.amount;
        }
      })
      .addCase(millisecondsPassed.pending, () => {})
      .addCase(millisecondsPassed.fulfilled, (state, action) => {
        state.currentTime = action.payload.newTime;
        state.images = action.payload.newImages;
      });
  },
});

export const {
  increment,
  decrement,
  incrementByAmount,
  clickedPlayButton,
  clickedPauseButton,
  timerTicked,
  timerStarted,
  timerStopped,
} = counterSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const getCount = (state: RootState) => state.counter.value;

export const getTargetIsVisible = (state: RootState) =>
  state.counter.targetIsVisible;

export const getSimulationIsRunning = (state: RootState) =>
  state.counter.simulationIsRunning;

export const getImages = (state: RootState) => state.counter.images;

export const getCurrentTime = (state: RootState) => state.counter.currentTime;

export const getGenerationParams = (state: RootState) =>
  state.counter.generationParams;

// We can also write thunks by hand, which may contain both sync and async logic.
// Here's an example of conditionally dispatching actions based on current state.
export const incrementIfOdd =
  (amount: number): AppThunk =>
  (dispatch, getState) => {
    const currentValue = getCount(getState());
    if (currentValue % 2 === 1) {
      dispatch(incrementByAmount(amount));
    }
  };

export default counterSlice.reducer;
