import React, { useState } from 'react';

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  decrement,
  increment,
  incrementByAmount,
  incrementAsync,
  incrementIfOdd,
  getCount,
  getTargetIsVisible,
  autoIncrement2, getSimulationIsRunning, clickedPlayButton, clickedPauseButton
} from './counterSlice';
import styles from './Counter.module.css';
import numbersSvg from "../../1121.svg";

export function Counter() {
  const count = useAppSelector(getCount);
  const simulationIsRunning = useAppSelector(getSimulationIsRunning);
  const dispatch = useAppDispatch();
  const [incrementAmount, setIncrementAmount] = useState('2');

  const incrementValue = Number(incrementAmount) || 0;

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
            onClick={() => dispatch(autoIncrement2({amount: incrementValue, numTimes:4}))}
        >
          Auto-increment 4 times
        </button>
        {simulationIsRunning ? <PauseButton/> : <PlayButton/>}
      </div>
      <div className={styles.row}>
        <DisappearingImage/>
      </div>
    </div>
  );
}

function SimpleButton(props:{onClick:Function, buttonText: string}) {
  const dispatch = useAppDispatch();

  return <button className={styles.button} onClick={() => dispatch(props.onClick())}>{props.buttonText}</button>
}

function PauseButton(){
  return <SimpleButton onClick={clickedPauseButton} buttonText={"▌▌"}/>;
}
function PlayButton(){
  return <SimpleButton onClick={clickedPlayButton} buttonText={"▶"}/>;
}

function DisappearingImage(){
  const targetIsVisible = useAppSelector(getTargetIsVisible);
  return targetIsVisible ?
      <img src={numbersSvg} className={styles.fadeInImage} alt="This disappears and reappears"/>
 :
      <img src={numbersSvg} className={styles.transparentImage} alt="This disappears and reappears"/>;
}
