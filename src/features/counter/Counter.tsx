import React, { useState } from 'react';

import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  decrement,
  increment,
  incrementByAmount,
  incrementAsync,
  incrementIfOdd,
  selectCount,
  selectTargetVisibility, autoIncrement2,
} from './counterSlice';
import styles from './Counter.module.css';
import logo from "../../logo.svg";

export function Counter() {
  const count = useAppSelector(selectCount);
  const targetIsVisible = useAppSelector(selectTargetVisibility);
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
      </div>
      <div className={styles.row}>
        <DisappearingImage/>
      </div>
    </div>
  );
}

function DisappearingImage(){
  const targetIsVisible = useAppSelector(selectTargetVisibility);
  return targetIsVisible ?
      <img src={logo} className={styles.fadeInImage} alt="This disappears and reappears"/>
 :
      <img src={logo} className={styles.transparentImage} alt="This disappears and reappears"/>;
}
