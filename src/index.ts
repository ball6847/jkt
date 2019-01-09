"use strict";

import container from "./container";
import { isDeleteProperty } from "./datatypes";
import extendBuilder from "./extender";
import { hasReservedKeys, triggerErrorReservedKeys } from "./reserved_keys";
import Splitter, { enumSplitter } from "./splitter";
import translator from "./translator";
import utils from "./utils";
import { isArray, isENUMObject, isJKTObject } from "./utils/detector";

const splitter = Splitter(true);

const descendantChecker = descendantsIds => {
  return struct => descendantsIds.includes(struct.__id[struct.__id.length - 1]);
};

const makeInstance = (__id, schema, utils) => {
  const structId = isArray(__id) ? __id : [__id];
  const cleanSchema = {}; // pure schema
  const dirtySchema = {}; // impure schema because it's including builtin jkt function
  const descentChecker = descendantChecker(structId);

  Object.keys(schema).forEach(key => {
    if (!isDeleteProperty(schema[key])) {
      if (!isENUMObject(schema[key])) {
        cleanSchema[key] = !isJKTObject(schema[key]) ? schema[key] : schema[key].schema;
      } else {
        cleanSchema[key] = `ENUM(${JSON.stringify(Object.keys(schema[key].j())).replace(
          /\]*\[*\"*/g,
          ""
        )})`;
      }
      dirtySchema[key] = schema[key];
    }
  });

  const struct = function(...vals) {
    if (utils.detect.isObject(vals[0])) {
      const parsed = utils.parse(vals[0]);
      Object.assign(parsed, {
        j: () => utils.serialize(parsed),
        getSchema: () => cleanSchema,
        getDirtySchema: () => dirtySchema,
        toJSON: () => utils.serialize(parsed),
        toString: () => JSON.stringify(utils.serialize(parsed)),
        instanceOf: struct => descentChecker(struct)
      });
      return parsed;
    } else {
      const str = vals.shift();
      return extendBuilder(structId, dirtySchema)(str, ...vals);
    }
  };

  // builtin properties
  struct.isJKT = true;
  struct.schema = cleanSchema;
  struct.childOf = struct => descentChecker(struct);

  struct.__id = structId;
  struct.__schema = dirtySchema;

  // make enum available to access directly by calling property
  const enumKey = "E";
  Object.keys(dirtySchema).forEach(key => {
    if (isENUMObject(schema[key])) {
      if (!struct[enumKey]) struct[enumKey] = {};
      struct[enumKey][key.toUpperCase()] = schema[key].j();
    }
  });

  return struct;
};

const jkt = (strings, ...bindings) => {
  const __id = utils.generator.generateId();
  const schema = splitter(strings, bindings);
  if (hasReservedKeys(schema)) triggerErrorReservedKeys();
  return makeInstance(__id, schema, utils.makeUtils(schema));
};

jkt.array = jktObj => {
  return container.arr(jktObj);
};

const ENUM = (strings, ...bindings) => {
  const enumDefinitions = enumSplitter(strings, bindings);
  const enumFunc = function() {
    return enumDefinitions;
  };
  enumFunc.isJKTENUM = true;
  enumFunc.j = () => enumDefinitions;
  enumFunc.toJSON = () => enumDefinitions;
  return enumFunc;
};

export const Inst = makeInstance;
export const c = container;
export const trans = translator;
export { jkt, ENUM };
export default jkt;
