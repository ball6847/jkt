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

// tslint:disable-next-line:variable-name
const makeInstance = (__id, schema, u) => {
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
          "",
        )})`;
      }
      dirtySchema[key] = schema[key];
    }
  });

  const struct = (...vals) => {
    if (u.detect.isObject(vals[0])) {
      const parsed = u.parse(vals[0]);
      Object.assign(parsed, {
        j: () => u.serialize(parsed),
        getSchema: () => cleanSchema,
        getDirtySchema: () => dirtySchema,
        toJSON: () => u.serialize(parsed),
        toString: () => JSON.stringify(u.serialize(parsed)),
        instanceOf: instance => descentChecker(instance),
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
  struct.childOf = parentStruct => descentChecker(parentStruct);

  struct.__id = structId;
  struct.__schema = dirtySchema;

  // make enum available to access directly by calling property
  const enumKey = "E";
  Object.keys(dirtySchema).forEach(key => {
    if (isENUMObject(schema[key])) {
      if (!struct[enumKey]) {
        struct[enumKey] = {};
      }
      struct[enumKey][key.toUpperCase()] = schema[key].j();
    }
  });

  return struct;
};

const jkt = (strings: TemplateStringsArray, ...bindings: any[]) => {
  // tslint:disable-next-line:variable-name
  const __id = utils.generator.generateId();
  const schema = splitter(strings, bindings);
  if (hasReservedKeys(schema)) {
    triggerErrorReservedKeys();
  }
  return makeInstance(__id, schema, utils.makeUtils(schema));
};

jkt.array = jktObj => {
  return container.arr(jktObj);
};

const ENUM = (strings, ...bindings) => {
  const enumDefinitions = enumSplitter(strings, bindings);
  const enumFunc = () => enumDefinitions;
  enumFunc.isJKTENUM = true;
  enumFunc.j = () => enumDefinitions;
  enumFunc.toJSON = () => enumDefinitions;
  return enumFunc;
};

jkt.Inst = makeInstance;
jkt.c = container;
jkt.trans = translator;
jkt.ENUM = ENUM;

export = jkt;
