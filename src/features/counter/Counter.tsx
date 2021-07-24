import React, { useEffect, useState } from "react";

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
  millisecondsPassed,
  timerTicked,
  timerStarted,
  timerStopped,
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
    this.tickerHandle = window.setInterval(() => dispatch(timerTicked(50)), 50);
    dispatch(timerStarted());
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
          <DisappearingImage
            key={i.key}
            x={i.x}
            visibility={
              i.timeToFinishFadeIn < curTime
                ? i.timeToStartFadeIn >= curTime
                  ? "fading"
                  : "gone"
                : "visible"
            }
          />
        ))}
      </div>
    </div>
  );
}

function SimpleButton(props: { onClick: Function; buttonText: string }) {
  const dispatch = useAppDispatch();

  return (
    <button className={styles.button} onClick={() => dispatch(props.onClick())}>
      {props.buttonText}
    </button>
  );
}

function PauseButton() {
  return <SimpleButton onClick={clickedPauseButton} buttonText={"▌▌"} />;
}
function PlayButton() {
  return <SimpleButton onClick={clickedPlayButton} buttonText={"▶"} />;
}

function DisappearingImage(props: {
  x: number;
  visibility: "fading" | "visible" | "gone";
}) {
  // TODO use the x position
  switch (props.visibility) {
    case "fading":
      return (
        <img
          src={numbersSvg}
          className={styles.fadeInImage}
          alt="This disappears and reappears"
        />
      );
    case "visible":
      return (
        <img
          src={numbersSvg}
          className={styles.opaqueImage}
          alt="This disappears and reappears"
        />
      );
    case "gone":
      return (
        <img
          src={numbersSvg}
          className={styles.transparentImage}
          alt="This disappears and reappears"
        />
      );
  }
}
