import React, { CSSProperties, useEffect } from "react";

import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
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
} from "./goneGameDisplaySlice";
import styles from "./GoneGameDisplay.module.css";
import meditatorSvg from "../../meditator.svg";
import { AppDispatch } from "../../app/store";
import * as R from "ramda";

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

export function GoneGameDisplay() {
  const simulationIsRunning = useAppSelector(getSimulationIsRunning);
  const images = useAppSelector(getImages);
  const curTime = useAppSelector(getCurrentTime);
  const dispatch = useAppDispatch();
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
        {simulationIsRunning ? <PauseButton /> : <PlayButton />}
      </div>
      <div className={styles.row}>
        {R.reverse(images).map((i: ImageProps) => (
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
  const { curTime } = props;
  const { timeToStartFadeIn, timeToFinishFadeIn, timeToDisappear, x } =
    props.image;
  let style: CSSProperties = {
    position: "absolute",
    left: x,
    top: 0,
  };
  if (timeToStartFadeIn <= curTime && curTime < timeToFinishFadeIn) {
    const fadeInText =
      "fadeIn " + (timeToFinishFadeIn - timeToStartFadeIn) / 1000 + "s";
    let fadeInStyle = {
      ...style,
      animation: fadeInText,
      WebkitAnimation: fadeInText,
      MozAnimation: fadeInText,
      OAnimation: fadeInText,
      msAnimation: fadeInText,
    };
    return (
      <img
        style={fadeInStyle}
        src={meditatorSvg}
        className={styles.fadeInImage}
        alt="This disappears and reappears"
      />
    );
  } else if (timeToFinishFadeIn <= curTime && curTime < timeToDisappear) {
    return (
      <img
        style={style}
        src={meditatorSvg}
        className={styles.opaqueImage}
        alt="This disappears and reappears"
      />
    );
  } else {
    return (
      <img
        src={meditatorSvg}
        className={styles.transparentImage}
        alt="This disappears and reappears"
      />
    );
  }
}
