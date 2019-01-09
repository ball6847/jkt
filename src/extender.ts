import { hasReservedKeys, triggerErrorReservedKeys } from "./reserved_keys";
import Splitter from "./splitter";
import { generator } from "./utils";

// tslint:disable-next-line:variable-name
const extendBuilder = (__id, baseSchema, strict = false) => {
  const splitter = Splitter(strict);
  return (childStrings, ...childBindings) => {
    const { makeUtils } = require("./utils");
    const { Inst } = require("./index");
    const childSchema = splitter(childStrings, childBindings);
    const newSchema = Object.assign({}, baseSchema, childSchema);

    if (hasReservedKeys(newSchema)) {
      triggerErrorReservedKeys();
    }

    const childId = generator.generateId();
    const newId = __id.concat([childId]);
    return Inst(newId, newSchema, makeUtils(newSchema));
  };
};

export default extendBuilder;
