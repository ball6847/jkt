import { isDeleteProperty } from "./datatypes";
import { extendBuilder } from "./extender";
import { IJktObject, IStruct } from "./interface";
import { isENUMObject, isJKTObject } from "./utils/detector";

// TODO: check usage of id, is it neccessary to accept both string and string[] for id
export function makeInstance(id: string | string[], schema, u) {
  const structId = Array.isArray(id) ? id : [id];
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
}

const descendantChecker = (descendantsIds: string[]) => {
  return struct => descendantsIds.includes(struct.__id[struct.__id.length - 1]);
};
