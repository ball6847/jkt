import { container } from "./container";
import { makeInstance } from "./makeInstance";
import { hasReservedKeys, triggerErrorReservedKeys } from "./reservedKeys";
import { makeEnumSplitter, makeSplitter } from "./splitter";
import { customValueTranslator } from "./translator";
import { generateId } from "./utils/generator";
import { makeUtils } from "./utils/make";

const splitter = makeSplitter(true);

const translator = { custom: customValueTranslator };

function jkt(strings: TemplateStringsArray, ...bindings: any[]) {
  const id = generateId();
  const schema = splitter(strings, bindings);
  if (hasReservedKeys(schema)) {
    triggerErrorReservedKeys();
  }
  return makeInstance(id, schema, makeUtils(schema));
}

function ENUM(strings: TemplateStringsArray, ...bindings: any[]) {
  const enumDefinitions = makeEnumSplitter(strings, bindings);
  const enumFunc = () => enumDefinitions;
  enumFunc.isJKTENUM = true;
  enumFunc.j = () => enumDefinitions;
  enumFunc.toJSON = () => enumDefinitions;
  return enumFunc;
}

jkt.array = jktObj => container(jktObj);
jkt.Inst = makeInstance;
jkt.c = { array: container, arr: container };
jkt.trans = translator;
jkt.ENUM = ENUM;

export = jkt;
