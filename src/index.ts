import * as container from "./container";
import { isDeleteProperty } from "./datatypes";
import extendBuilder from "./extender";
import { IJktObject, IStruct } from "./interface";
import { hasReservedKeys, triggerErrorReservedKeys } from "./reserved_keys";
import { enumSplitter, splitter as createSplitter } from "./splitter";
import translator from "./translator";
import utils from "./utils";
import { isENUMObject, isJKTObject } from "./utils/detector";

const splitter = createSplitter(true);

const descendantChecker = (descendantsIds: string[]) => {
  return struct => descendantsIds.includes(struct.__id[struct.__id.length - 1]);
};

// TODO: check usage of __id, is it neccessary to accept both string and string[] for __id
// tslint:disable-next-line:variable-name
const makeInstance = (__id: string | string[], schema, u) => {
  const structId = Array.isArray(__id) ? __id : [__id];
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

  const struct: IStruct = (...vals) => {
    if (u.detect.isObject(vals[0])) {
      const parsed: unknown & IJktObject = u.parse(vals[0]);
      parsed.j = () => u.serialize(parsed);
      parsed.getSchema = () => cleanSchema;
      parsed.getDirtySchema = () => dirtySchema;
      parsed.toJSON = () => u.serialize(parsed);
      parsed.toString = () => JSON.stringify(u.serialize(parsed));
      parsed.instanceOf = instance => descentChecker(instance);

      // Object.assign(parsed, {
      //   j: () => u.serialize(parsed),
      //   getSchema: () => cleanSchema,
      //   getDirtySchema: () => dirtySchema,
      //   toJSON: () => u.serialize(parsed),
      //   toString: () => JSON.stringify(u.serialize(parsed)),
      //   instanceOf: instance => descentChecker(instance),
      // });
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
  return container.array(jktObj);
};

const ENUM = (strings: TemplateStringsArray, ...bindings: any[]) => {
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
