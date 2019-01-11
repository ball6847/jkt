import { makeInstance } from "./makeInstance";
import { hasReservedKeys, triggerErrorReservedKeys } from "./reservedKeys";
import { makeSplitter } from "./splitter";
import { generateId } from "./utils/generator";
import { makeUtils } from "./utils/make";

export function extendBuilder(id, baseSchema, strict = false) {
  const splitter = makeSplitter(strict);
  return (childStrings, ...childBindings) => {
    const childSchema = splitter(childStrings, childBindings);
    const newSchema = { ...baseSchema, ...childSchema };

    if (hasReservedKeys(newSchema)) {
      triggerErrorReservedKeys();
    }

    const childId = generateId();
    const newId = id.concat([childId]);
    return makeInstance(newId, newSchema, makeUtils(newSchema));
  };
}
