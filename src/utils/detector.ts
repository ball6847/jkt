"use strict";

const ARRAY_V = "[object Array]";
const OBJECT_V = "[object Object]";
const STRING_V = "[object String]";
const FUNC_V = "[object Function]";
const NUMBER_V = "[object Number]";
const BOOL_V = "[object Boolean]";
const NULL_V = "[object Null]";
const DATE_V = "[object Date]";
const UNDEF_V = "[object Undefined]";
const ERROR_V = "[object Error]";
const SYMBOL_V = "[object Symbol]";

const comparator = comp => {
  return obj => Object.prototype.toString.call(obj) === comp;
};

export const isArray = comparator(ARRAY_V);
export const isObject = comparator(OBJECT_V);
export const isFunction = comparator(FUNC_V);
export const isString = comparator(STRING_V);
export const isNumber = comparator(NUMBER_V);
export const isBoolean = comparator(BOOL_V);
export const isNull = comparator(NULL_V);
export const isDate = comparator(DATE_V);
export const isUndefined = comparator(UNDEF_V);
export const isError = comparator(ERROR_V);
export const isSymbol = comparator(SYMBOL_V);
export const isInt = num => !isSymbol(num) && Number(num) === num && num % 1 === 0;
export const isFloat = num => !isSymbol(num) && Number(num) === num && num % 1 !== 0;
export const isStringFloat = num =>
  !isNull(num) && !isFloat(num) && !isNaN(num) && num.toString().indexOf(".") != -1;
export const isJKTObject = valueType => {
  let isJKT = false;
  let hasSchema = false;
  if (Object(valueType).hasOwnProperty("isJKT")) isJKT = true;
  if (Object(valueType).hasOwnProperty("schema") && isObject(valueType.schema)) hasSchema = true;

  return isJKT && hasSchema;
};

export const isENUMObject = valueType => {
  let isENUM = false;
  let hasToJsonFunc = false;
  if (Object(valueType).hasOwnProperty("isJKTENUM")) isENUM = true;
  if (Object(valueType).hasOwnProperty("j") && Object(valueType).hasOwnProperty("toJSON"))
    hasToJsonFunc = true;
  return isENUM && hasToJsonFunc;
};

export const isTranslatorObject = valueType => {
  let isTranslator = false;
  let hasTranslateFunc = false;
  if (Object(valueType).hasOwnProperty("isJKTTRANSLATOR")) isTranslator = true;
  if (Object(valueType).hasOwnProperty("translate")) hasTranslateFunc = true;
  return isTranslator && hasTranslateFunc;
};

const hasMappingKey = key => /[a-zA-Z0-9\_]+\-\>[a-zA-Z0-9\_]+/g.test(key);

export default {
  isArray,
  isObject,
  isFunction,
  isString,
  isNumber,
  isBoolean,
  isNull,
  isDate,
  isUndefined,
  isError,
  isSymbol,
  isInt,
  isFloat,
  isStringFloat,
  isJKTObject,
  isENUMObject,
  isTranslatorObject,
  hasMappingKey
};
