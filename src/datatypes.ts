import { values as loValues } from "lodash-es";
import {
  isArray,
  isBoolean,
  isDate,
  isENUMObject,
  isError,
  isFloat,
  isFunction,
  isInt,
  isJKTObject,
  isNull,
  isNumber,
  isObject,
  isString,
  isSymbol,
  isTranslatorObject,
} from "./utils/detector";

export const STRING = "String";
export const STRING_ONLY = `${STRING}!`;
export const NUMBER = "Number";
export const NUMBER_ONLY = `${NUMBER}!`;
export const DATE = "Date";
export const DATE_ONLY = `${DATE}!`;
export const DATE_PLAIN = "DatePlain";
export const DATE_PLAIN_ONLY = `${DATE_PLAIN}!`;
export const BOOLEAN = "Boolean";
export const BOOLEAN_ONLY = `${BOOLEAN}!`;
export const OBJECT = "Object";
export const OBJECT_ONLY = `${OBJECT}!`;
export const ARRAY = "Array";
export const ARRAY_ONLY = `${ARRAY}!`;
export const FUNCTION = "Function";
export const FUNCTION_ONLY = `${FUNCTION}!`;
export const ANY = "Any";

export const parserableTypes = typeName =>
  [STRING, ARRAY, BOOLEAN, DATE, DATE_PLAIN, FUNCTION, NUMBER, OBJECT, ANY].includes(typeName);

export const nonNullableTypes = typeName =>
  [
    STRING_ONLY,
    ARRAY_ONLY,
    BOOLEAN_ONLY,
    DATE_ONLY,
    DATE_PLAIN_ONLY,
    FUNCTION_ONLY,
    NUMBER_ONLY,
    OBJECT_ONLY,
  ].includes(typeName);

export const isPredefinedTypes = valueType =>
  isFunction(valueType) ||
  isArray(valueType) ||
  isObject(valueType) ||
  isBoolean(valueType) ||
  isDate(valueType) ||
  isError(valueType) ||
  isNull(valueType) ||
  isNumber(valueType) ||
  isFloat(valueType) ||
  isInt(valueType) ||
  isSymbol(valueType) ||
  isTranslatorObject(valueType) ||
  (isString(valueType) && !nonNullableTypes(valueType) && !parserableTypes(valueType));

export const hasValidTypes = schema => {
  let valid = true;
  loValues(schema).forEach(t => {
    if (!(parserableTypes(t) || nonNullableTypes(t))) {
      const validPredefinedVal =
        isFunction(t) ||
        isArray(t) ||
        isObject(t) ||
        isBoolean(t) ||
        isDate(t) ||
        isError(t) ||
        isNull(t) ||
        isNumber(t) ||
        isString(t) ||
        isInt(t) ||
        isFloat(t) ||
        isSymbol(t) ||
        isJKTObject(t) ||
        isTranslatorObject(t) ||
        isENUMObject(t);
      if (!validPredefinedVal) {
        valid = false;
      }
    }
  });
  return valid;
};

export const isDeleteProperty = value => !isSymbol(value) && /\s*\!DELETE\s*/g.test(value);
