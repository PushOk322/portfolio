import React, { useEffect, useRef, useState } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll';
import ReactInputMask from 'react-input-mask';
import './Input.scss';
import InputAprove from "../../../assets/icons/input-aprove.svg";
import Alarm from '../../../assets/icons/alarmIcon.svg'

const Input = ({
  type,
  className,
  placeholder,
  setValue,
  setErrorState = () => {},
  apiError = '',
  setApiError,
  id,
  error,
  textError,
  isValid = false,
  inputType
}) => {
  const { ref: focusableRef, focused } = useFocusableWithScroll({});
  const inputRef = useRef(null);
  const [code, setCode] = useState('');
  const [displayError, setDisplayError] = useState(false);
console.log(focused)
  useEffect(() => {
    if (error || apiError) {
      setDisplayError(true);
    } else {
      setDisplayError(false);
    }
  }, [error, apiError]);

  useEffect(() => {
    if (code === '' || code === 'XX-XX-XX') {
      setErrorState(false);
      setApiError && setApiError('');
    }
  }, [focused, code]);

  useEffect(() => {
    if (focused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focused]);

  // Set focus to the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCode = (e) => {
    const value = e.target.value;
    setCode(value);
    setValue(value);
    if (value) {
      setErrorState(false);
    }
  };

  return (
    <div
      className={`input ${!focused ? 'input--disabled' : ''}`}
      ref={focusableRef}
    >
      {inputType === 'tel' ? (
        <ReactInputMask
          id={id}
          mask='**-**-**'
          formatChars={{ '*': '[A-Za-z0-9]' }}
          value={code}
          onChange={handleCode}
          maskChar='X'
          disabled={!focused} 
          >
          {(inputProps) => (
            <input
              id={id}
              {...inputProps}
              ref={inputRef}
              type='text'
              className={`input__form ${className} ${inputType === 'tel' ? 'tel' : ''} ${displayError && 'error'}`}
              placeholder={placeholder}
              disabled={!focused} 
            />
          )}
        </ReactInputMask>
      ) : (
        <input
          id={id}
          name='kiviInput'
          ref={inputRef}
          type={type}
          className={`input__form ${className} ${type === 'tel' ? 'tel' : ''} ${displayError && 'error'}`}
          placeholder={placeholder}
          onChange={handleCode}
          disabled={!focused}
        />
      )}
      {isValid && !displayError && <img src={InputAprove} alt='aprove' className='input__aprove' />}
      {displayError && <img src={Alarm} alt='alarm' className='input__alarm' />}
      {displayError && <label htmlFor={id} className='input__label'>{textError}</label>}
    </div>
  );
};

export default Input;
