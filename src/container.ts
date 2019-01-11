import values from "lodash/values";
import utils from "./utils";
import { isArray, isJKTObject, isNull } from "./utils/detector";
import { valueParser } from "./utils/parser";

const baseContainerData = {
  isContainer: true,
};

const appendContainerData = f => {
  f.isContainer = true;
  return f;
};

export const array = (value, strictNull = false, defaultToArray = false) => {
  const parse = (parser, valueToParse) => {
    if (isArray(valueToParse)) {
      const parsedValues = [];
      valueToParse.forEach(item => {
        if (isJKTObject(value)) {
          const p = parser(value.__schema, item);
          let hasNotNullValue = false;
          values(p).forEach(v => {
            if (!isNull(v) && v !== undefined) {
              hasNotNullValue = true;
            }
          });
          if (strictNull) {
            if (hasNotNullValue) {
              parsedValues.push(p);
            }
          } else {
            parsedValues.push(p);
          }
        } else {
          parsedValues.push(item);
        }
      });
      return parsedValues;
    } else {
      return defaultToArray ? [] : null;
    }
  };

  const obj = valueToParse => {
    const parsed = parse(valueParser, valueToParse);
    const util = utils.makeUtils(value.schema);
    Object.assign(parsed, {
      j: () => util.serialize(parsed),
      getSchema: () => value.schema,
      toJSON: () => util.serialize(parsed),
      toString: () => JSON.stringify(util.serialize(parsed)),
      instanceOf: (struct: any) => value.instanceOf(struct),
    });
    return parsed;
  };

  obj.parse = parse;
  return appendContainerData(obj);
};

export const arr = array;
