import isNil from "lodash/isNil";
import values from "lodash/values";
import moment from "moment";
import {
  ANY,
  ARRAY,
  ARRAY_ONLY,
  BOOLEAN,
  BOOLEAN_ONLY,
  DATE,
  DATE_ONLY,
  DATE_PLAIN,
  DATE_PLAIN_ONLY,
  FUNCTION,
  FUNCTION_ONLY,
  isDeleteProperty,
  isPredefinedTypes,
  nonNullableTypes,
  NUMBER,
  NUMBER_ONLY,
  OBJECT,
  OBJECT_ONLY,
  parserableTypes,
  STRING,
  STRING_ONLY,
} from "../datatypes";
import detector from "./detector";
import extractMapKey from "./mapkey_extractor";

const validDateFromString = (dateVal: moment.MomentInput, utcAware = true) => {
  if (detector.isString(dateVal)) {
    try {
      // detect ISO 8601
      const date = utcAware ? moment(dateVal) : moment.utc(dateVal);
      if (date.isValid()) {
        return date;
      }
    } catch (err) {
      return false;
    }
  }
  return false;
};

const parser = {
  [STRING]: (val: any) => {
    if (detector.isString(val) && val.length) {
      return val;
    }
    const parsed = val ? JSON.stringify(val) : null;
    return detector.isString(parsed) && parsed.length > 0 ? parsed : null;
  },
  [ARRAY]: (val: any) => (detector.isArray(val) ? val : null),
  [BOOLEAN]: (val: any) => (detector.isBoolean(val) ? val : null),
  [DATE]: (val: any) => {
    if (detector.isDate(val)) {
      return val;
    }
    return validDateFromString(val) || null;
  },
  [DATE_PLAIN]: (val: any) => {
    if (detector.isDate(val)) {
      return val;
    }
    return validDateFromString(val, false) || null;
  },
  [FUNCTION]: (val: any) => (detector.isFunction(val) ? val : null),
  [NUMBER]: (val: any) => {
    if (detector.isNumber(val)) {
      return val;
    }
    if (val && !isNaN(val)) {
      return detector.isStringFloat(val) ? parseFloat(val) : parseInt(val, 10);
    }
    return null;
  },
  [OBJECT]: (val: any) => (detector.isObject ? val : null),
  [ANY]: (val: any) => val,
};

const nonNullableChecker = {
  [STRING_ONLY]: (val: any) => detector.isString(val),
  [ARRAY_ONLY]: (val: any) => detector.isArray(val),
  [BOOLEAN_ONLY]: (val: any) => detector.isBoolean(val),
  [DATE_ONLY]: (val: any) => detector.isDate(val) || validDateFromString(val) !== null,
  [DATE_PLAIN_ONLY]: (val: any) => detector.isDate(val) || validDateFromString(val, false) !== null,
  [FUNCTION_ONLY]: (val: any) => detector.isFunction(val),
  [NUMBER_ONLY]: (val: any) => {
    if (val && !isNaN(val)) {
      return detector.isStringFloat(val) ? parseFloat(val) : parseInt(val, 10);
    }

    return false;
  },
  [OBJECT_ONLY]: (val: any) => detector.isObject(val),
};

const nonNullableParser = {
  [STRING_ONLY]: (val: any) => parser[STRING](val),
  [ARRAY_ONLY]: (val: any) => parser[ARRAY](val),
  [BOOLEAN_ONLY]: (val: any) => parser[BOOLEAN](val),
  [DATE_ONLY]: (val: any) => parser[DATE](val),
  [DATE_PLAIN_ONLY]: (val: any) => parser[DATE_PLAIN](val),
  [FUNCTION_ONLY]: (val: any) => parser[FUNCTION](val),
  [NUMBER_ONLY]: (val: any) => parser[NUMBER](val),
  [OBJECT_ONLY]: (val: any) => parser[OBJECT](val),
};

const valueParser = (schema, valuesToParse) => {
  const parsedValues = {};
  Object.keys(schema).forEach(key => {
    const valueType = schema[key];
    if (isDeleteProperty(valueType)) {
      return;
    }

    const [srcKey, mapKey] = extractMapKey(key);
    if (mapKey !== null) {
      key = mapKey;
    }

    const value =
      detector.isUndefined(valuesToParse) || detector.isNull(valuesToParse)
        ? valuesToParse
        : valuesToParse[srcKey !== null ? srcKey : key];

    if (!detector.isUndefined(value) || detector.isJKTObject(valueType)) {
      if (parserableTypes(valueType) && !detector.isJKTObject(valueType)) {
        parsedValues[key] = parser[valueType](value);
      } else if (detector.isJKTObject(valueType)) {
        // handle jkt obj
        parsedValues[key] = valueParser(valueType.__schema, value);
      } else if (detector.isENUMObject(valueType)) {
        // handle enum
        const validEnumValues = values(valueType.j());
        parsedValues[key] = validEnumValues.includes(value) ? value : null;
      } else if (detector.isTranslatorObject(valueType)) {
        // handle translator
        parsedValues[key] = valueType.translate(value);
      } else if (nonNullableTypes(valueType)) {
        if (!isNil(nonNullableChecker[valueType](value))) {
          parsedValues[key] = nonNullableParser[valueType](value);
        }
      } else if (valueType.isContainer) {
        // struct inside of container
        parsedValues[key] = valueType.parse(valueParser, value);
      } else {
        parsedValues[key] = value;
      }
    } else if (!parserableTypes(valueType) && isPredefinedTypes(valueType)) {
      // Do not parse enum value
      if (!detector.isENUMObject(valueType)) {
        // the predefined type is container type
        // so we put value handled with its container here
        if (valueType.isContainer) {
          parsedValues[key] = valueType.parse(valueParser, value);
        } else {
          // custom defined values from the begining of struct creation
          parsedValues[key] = valueType;
        }
      }
    } else {
      // Value was undefined or not matched with available schema
      if (!nonNullableTypes(valueType)) {
        parsedValues[key] = null;
      }
    }
  });
  return parsedValues;
};

const parse = baseSchema => {
  return valuesToParse => valueParser(baseSchema, valuesToParse);
};

export default parse;
export { valueParser };
