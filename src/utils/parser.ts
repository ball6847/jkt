import isNil from "lodash/isNil";
import values from "lodash/values";
import moment from "moment";
import * as type from "../datatypes";
import * as detector from "./detector";
import { extractMapKey } from "./mapkeyExtractor";

const parser = {
  [type.STRING]: (val: any) => {
    if (detector.isString(val) && val.length) {
      return val;
    }
    const parsed = val ? JSON.stringify(val) : null;
    return detector.isString(parsed) && parsed.length > 0 ? parsed : null;
  },
  [type.ARRAY]: (val: any) => (detector.isArray(val) ? val : null),
  [type.BOOLEAN]: (val: any) => (detector.isBoolean(val) ? val : null),
  [type.DATE]: (val: any) => {
    if (detector.isDate(val)) {
      return val;
    }
    return validDateFromString(val) || null;
  },
  [type.DATE_PLAIN]: (val: any) => {
    if (detector.isDate(val)) {
      return val;
    }
    return validDateFromString(val, false) || null;
  },
  [type.FUNCTION]: (val: any) => (detector.isFunction(val) ? val : null),
  [type.NUMBER]: (val: any) => {
    if (detector.isNumber(val)) {
      return val;
    }
    if (val && !isNaN(val)) {
      return detector.isStringFloat(val) ? parseFloat(val) : parseInt(val, 10);
    }
    return null;
  },
  [type.OBJECT]: (val: any) => (detector.isObject ? val : null),
  [type.ANY]: (val: any) => val,
};

const nonNullableChecker = {
  [type.STRING_ONLY]: (val: any) => detector.isString(val),
  [type.ARRAY_ONLY]: (val: any) => detector.isArray(val),
  [type.BOOLEAN_ONLY]: (val: any) => detector.isBoolean(val),
  [type.DATE_ONLY]: (val: any) => detector.isDate(val) || validDateFromString(val) !== null,
  [type.DATE_PLAIN_ONLY]: (val: any) =>
    detector.isDate(val) || validDateFromString(val, false) !== null,
  [type.FUNCTION_ONLY]: (val: any) => detector.isFunction(val),
  [type.NUMBER_ONLY]: (val: any) => {
    if (val && !isNaN(val)) {
      return detector.isStringFloat(val) ? parseFloat(val) : parseInt(val, 10);
    }

    return false;
  },
  [type.OBJECT_ONLY]: (val: any) => detector.isObject(val),
};

const nonNullableParser = {
  [type.STRING_ONLY]: (val: any) => parser[type.STRING](val),
  [type.ARRAY_ONLY]: (val: any) => parser[type.ARRAY](val),
  [type.BOOLEAN_ONLY]: (val: any) => parser[type.BOOLEAN](val),
  [type.DATE_ONLY]: (val: any) => parser[type.DATE](val),
  [type.DATE_PLAIN_ONLY]: (val: any) => parser[type.DATE_PLAIN](val),
  [type.FUNCTION_ONLY]: (val: any) => parser[type.FUNCTION](val),
  [type.NUMBER_ONLY]: (val: any) => parser[type.NUMBER](val),
  [type.OBJECT_ONLY]: (val: any) => parser[type.OBJECT](val),
};

export const valueParser = (schema, valuesToParse) => {
  const parsedValues = {};
  Object.keys(schema).forEach(key => {
    const valueType = schema[key];
    if (type.isDeleteProperty(valueType)) {
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
      if (type.parserableTypes(valueType) && !detector.isJKTObject(valueType)) {
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
      } else if (type.nonNullableTypes(valueType)) {
        if (!isNil(nonNullableChecker[valueType](value))) {
          parsedValues[key] = nonNullableParser[valueType](value);
        }
      } else if (valueType.isContainer) {
        // struct inside of container
        parsedValues[key] = valueType.parse(valueParser, value);
      } else {
        parsedValues[key] = value;
      }
    } else if (!type.parserableTypes(valueType) && type.isPredefinedTypes(valueType)) {
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
      if (!type.nonNullableTypes(valueType)) {
        parsedValues[key] = null;
      }
    }
  });
  return parsedValues;
};

// TODO: function name could be changed to something like, parseSchema
export function parse(baseSchema) {
  return valuesToParse => valueParser(baseSchema, valuesToParse);
}

// private helper function

function validDateFromString(dateVal: moment.MomentInput, utcAware = true) {
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
}
