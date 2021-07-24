import React, { CSSProperties, useEffect, useState } from "react";

import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  decrement,
  increment,
  incrementByAmount,
  incrementAsync,
  incrementIfOdd,
  autoIncrement2,
  getSimulationIsRunning,
  clickedPlayButton,
  clickedPauseButton,
  getImages,
  getCurrentTime,
  timerTicked,
  timerStarted,
  timerStopped,
  tickInterval,
  ImageProps,
} from "./counterSlice";
import styles from "./Counter.module.css";
import numbersSvg from "../../1121.svg";
import { AppDispatch } from "../../app/store";

/**
 * Adapted from
 * https://medium.com/@machadogj/timers-in-react-with-redux-apps-9a5a722162e8
 */
class Ticker {
  tickerHandle: number | undefined;
  constructor() {
    this.tickerHandle = undefined;
  }
  start(dispatch: AppDispatch) {
    window.clearInterval(this.tickerHandle);
    this.tickerHandle = window.setInterval(
      () => dispatch(timerTicked(tickInterval)),
      tickInterval
    );
    dispatch(timerStarted());
  }
  pause(dispatch: AppDispatch) {
    window.clearInterval(this.tickerHandle);
    dispatch(clickedPauseButton());
  }
  restart(dispatch: AppDispatch) {
    window.clearInterval(this.tickerHandle);
    this.tickerHandle = window.setInterval(
      () => dispatch(timerTicked(tickInterval)),
      tickInterval
    );
    dispatch(clickedPlayButton());
  }
  stop(dispatch: AppDispatch) {
    clearInterval(this.tickerHandle);
    dispatch(timerStopped());
  }
}

let GlobalTicker = new Ticker();

export function Counter() {
  const simulationIsRunning = useAppSelector(getSimulationIsRunning);
  const images = useAppSelector(getImages);
  const curTime = useAppSelector(getCurrentTime);
  const count = curTime;
  const dispatch = useAppDispatch();
  const [incrementAmount, setIncrementAmount] = useState("2");

  const incrementValue = Number(incrementAmount) || 0;

  // Call useEffect once to get the tick loop started
  useEffect(
    () => {
      GlobalTicker.start(dispatch);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div>
      <div className={styles.row}>
        <button
          className={styles.button}
          aria-label="Decrement value"
          onClick={() => dispatch(decrement())}
        >
          -
        </button>
        <span className={styles.value}>{count}</span>
        <button
          className={styles.button}
          aria-label="Increment value"
          onClick={() => dispatch(increment())}
        >
          +
        </button>
      </div>
      <div className={styles.row}>
        <input
          className={styles.textbox}
          aria-label="Set increment amount"
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(e.target.value)}
        />
        <button
          className={styles.button}
          onClick={() => dispatch(incrementByAmount(incrementValue))}
        >
          Add Amount
        </button>
        <button
          className={styles.asyncButton}
          onClick={() => dispatch(incrementAsync(incrementValue))}
        >
          Add Async
        </button>
        <button
          className={styles.button}
          onClick={() => dispatch(incrementIfOdd(incrementValue))}
        >
          Add If Odd
        </button>
        <button
          className={styles.button}
          onClick={() =>
            dispatch(autoIncrement2({ amount: incrementValue, numTimes: 4 }))
          }
        >
          Auto-increment 4 times
        </button>
        {simulationIsRunning ? <PauseButton /> : <PlayButton />}
      </div>
      <div className={styles.row}>
        {images.map((i) => (
          <DisappearingImage key={i.key} curTime={curTime} image={i} />
        ))}
      </div>
    </div>
  );
}

function SimpleButton(props: { onClick: Function; buttonText: string }) {
  const dispatch = useAppDispatch();

  return (
    <button className={styles.button} onClick={() => props.onClick(dispatch)}>
      {props.buttonText}
    </button>
  );
}

function PauseButton() {
  return (
    <SimpleButton
      onClick={(dispatch: AppDispatch) => GlobalTicker.pause(dispatch)}
      buttonText={"▌▌"}
    />
  );
}
function PlayButton() {
  return (
    <SimpleButton
      onClick={(dispatch: AppDispatch) => GlobalTicker.restart(dispatch)}
      buttonText={"▶"}
    />
  );
}

function DisappearingImage(props: { curTime: number; image: ImageProps }) {
  // TODO use the x position
  let { curTime } = props;
  let { timeToStartFadeIn, timeToFinishFadeIn, timeToDisappear, x } =
    props.image;
  let style: CSSProperties = {
    position: "absolute",
    left: x,
  };
  if (timeToStartFadeIn <= curTime && curTime < timeToFinishFadeIn) {
    return (
      <img
        style={style}
        src={numbersSvg}
        className={styles.fadeInImage}
        alt="This disappears and reappears"
      />
    );
  } else if (timeToFinishFadeIn <= curTime && curTime < timeToDisappear) {
    return (
      <img
        style={style}
        src={numbersSvg}
        className={styles.opaqueImage}
        alt="This disappears and reappears"
      />
    );
  } else {
    return (
      <img
        src={numbersSvg}
        className={styles.transparentImage}
        alt="This disappears and reappears"
      />
    );
  }
}
