import React, { CSSProperties, useEffect } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clickedPauseButton,
  clickedPlayButton,
  getCurrentTime,
  getImages,
  getSimulationIsRunning,
  ImageProps,
  imageWidth,
  roundToNearest,
  tickInterval,
  timerStarted,
  timerStopped,
  timerTicked,
} from "./goneGameDisplaySlice";
import styles from "./GoneGameDisplay.module.css";
import { AppDispatch } from "../../app/store";
import * as R from "ramda";
import { glyphs } from "./Glyphs";

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
        {R.reverse(images).map((i: ImageProps, idx, arr) => (
          <DisappearingImage
            key={i.key}
            curTime={curTime}
            image={i}
            isHighlighted={idx + 1 === arr.length}
          />
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

const roundToHalf = roundToNearest(0.5);
const fadeInStyle = {
  "0.5": styles.fadeInImage05,
  "1": styles.fadeInImage10,
  "1.5": styles.fadeInImage15,
  "2": styles.fadeInImage20,
  "2.5": styles.fadeInImage25,
  "3": styles.fadeInImage30,
  "3.5": styles.fadeInImage35,
  "4": styles.fadeInImage40,
  "4.5": styles.fadeInImage45,
  "5": styles.fadeInImage50,
  "5.5": styles.fadeInImage55,
};

function DisappearingImage(props: {
  curTime: number;
  image: ImageProps;
  isHighlighted: boolean;
}) {
  const { curTime, isHighlighted } = props;
  const {
    timeToStartFadeIn,
    timeToFinishFadeIn,
    timeToDisappear,
    x,
    glyphIndex,
  } = props.image;
  let style: CSSProperties = {
    position: "absolute",
    left: x,
    top: 0,
    width: imageWidth,
  };
  if (!isHighlighted) {
    style = {
      ...style,
      filter: "opacity(25%)",
    };
  }
  const picture = glyphs[glyphIndex % glyphs.length];
  if (timeToStartFadeIn <= curTime && curTime < timeToFinishFadeIn) {
    // Most of this code is to avoid typing warnings
    const roundedFadeTime = roundToHalf(
      (timeToFinishFadeIn - timeToStartFadeIn) / 1000
    );
    const roundedFadeTimeStr = roundedFadeTime.toString();
    let class_ = undefined;
    if (
      roundedFadeTimeStr === "0.5" ||
      roundedFadeTimeStr === "1" ||
      roundedFadeTimeStr === "1.5" ||
      roundedFadeTimeStr === "2" ||
      roundedFadeTimeStr === "2.5" ||
      roundedFadeTimeStr === "3" ||
      roundedFadeTimeStr === "3.5" ||
      roundedFadeTimeStr === "4" ||
      roundedFadeTimeStr === "4.5" ||
      roundedFadeTimeStr === "5" ||
      roundedFadeTimeStr === "5.5"
    ) {
      class_ = fadeInStyle[roundedFadeTimeStr];
    }
    if (class_ === undefined) {
      class_ = roundedFadeTime > 5.5 ? fadeInStyle["5.5"] : fadeInStyle["0.5"];
    }

    return (
      <img
        style={style}
        src={picture}
        className={class_}
        alt="This disappears and reappears"
      />
    );
  } else if (timeToFinishFadeIn <= curTime && curTime < timeToDisappear) {
    return (
      <img
        style={style}
        src={picture}
        className={styles.opaqueImage}
        alt="This disappears and reappears"
      />
    );
  } else {
    return (
      <img
        src={picture}
        className={styles.transparentImage}
        alt="This disappears and reappears"
      />
    );
  }
}
