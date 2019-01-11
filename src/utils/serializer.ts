import { BOOLEAN, DATE, DATE_PLAIN, NUMBER, STRING } from "../datatypes";
import { isArray, isUndefined } from "./detector";
import { extractMapKey } from "./mapkey_extractor";

export function serialize(baseSchema) {
  return parsedValues => {
    if (isArray(parsedValues)) {
      return parsedValues.map(v => valueSerializer(baseSchema, v));
    } else {
      return valueSerializer(baseSchema, parsedValues);
    }
  };
}

const isSafeToRelease = typeName => [STRING, NUMBER, DATE, DATE_PLAIN, BOOLEAN].includes(typeName);

const safeSerializer = {
  [STRING]: val => val,
  [NUMBER]: val => val,
  [DATE]: val => (val ? val.toJSON() : null), // ISO-8601 UTC
  [DATE_PLAIN]: val => (val ? val.toJSON() : null), // ISO-8601 UTC
  [BOOLEAN]: val => val,
};

const purified = obj => {
  try {
    const parsed = JSON.parse(JSON.stringify(obj));
    return parsed;
  } catch (err) {
    return undefined;
  }
};

const valueSerializer = (baseSchema, parsedValues) => {
  const serializedValues = {};
  Object.keys(baseSchema).forEach(key => {
    const valueType = baseSchema[key];

    const [srcKey, mapKey] = extractMapKey(key);
    if (mapKey !== null) {
      key = mapKey;
    }

    const value = parsedValues[key];
    if (!isUndefined(value)) {
      if (isSafeToRelease(valueType)) {
        serializedValues[key] = safeSerializer[valueType](value);
      } else {
        const purifiedVal = purified(value);
        if (!isUndefined(purifiedVal)) {
          serializedValues[key] = purifiedVal;
        }
      }
    }
  });
  return serializedValues;
};
