import cloneDeep from "lodash/cloneDeep";
import values from "lodash/values";
import { isDeleteProperty, nonNullableTypes, parserableTypes } from "./datatypes";
import { isArray, isUndefined } from "./utils/detector";

export function makeSplitter(strict = false) {
  return (strings: TemplateStringsArray, ...bindings: any[]) => {
    emptyValidator(strings);

    const pairs = {};
    let bindIdx = 0;

    // spread value fix
    if (isArray(bindings) && bindings.length > 0) {
      bindings = bindings[0];
    }

    strings
      .filter(s => s.length > 0)
      .forEach(stmt => {
        const delimiter = ",";

        // Replacing all new lines with comma
        const preparedStr = stmt.replace(/(\r\n|\n|\r)/gm, delimiter);

        const rex = /\s*([a-zA-Z0-9\_\-\>]+\s*\:\s*[\!a-zA-Z]*\s*\,*[\r\n]*)/g;
        const splittedStr = preparedStr.split(rex);

        const removedCommaTrailSpcs = removeCommaAndTrailingSpaces(splittedStr);

        const cleanedBlocks = removedCommaTrailSpcs.filter(s => s.length > 0 && s !== delimiter);

        cleanedBlocks.forEach(block => {
          const [key, typeName] = block.split(":");

          pairs[key] =
            typeName.length > 0
              ? typeName.trim()
              : !isUndefined(bindings[bindIdx])
              ? cloneDeep(bindings[bindIdx])
              : bindings[bindIdx];

          // not using predefined-value detected
          if (typeName.length > 0) {
            const trimmedName = typeName.trim();
            const isKnownTypes =
              parserableTypes(trimmedName) ||
              nonNullableTypes(trimmedName) ||
              isDeleteProperty(trimmedName);

            if (!isKnownTypes) {
              throw new TypeError("Unknown type was given");
            }
          }

          // normalize array binding values
          if (isArray(pairs[key]) && pairs[key].length === 1) {
            pairs[key] = pairs[key][0];
          }

          if (typeName.length === 0) {
            bindIdx++;
          }
        });
      });

    const pairVals = values(pairs);
    const countUndefTypes = pairVals.filter(typeVal => typeof typeVal === "undefined").length;

    if (countUndefTypes > 0 && strict) {
      throw new Error("Invalid Schema Detected, please define the right value types");
    }

    return pairs;
  };
}

export function makeEnumSplitter(strings: TemplateStringsArray | string, ...bindings: any[]) {
  emptyValidator(strings);

  const pairs = {};
  let bindIdx = 0;

  // spread value fix
  if (isArray(bindings) && bindings.length > 0) {
    bindings = bindings[0];
  }

  // handle string argument
  const templates = typeof strings === "string" ? [strings] : strings;

  templates
    .filter(s => s.length > 0)
    .forEach(stmt => {
      const delimiter = ",";

      // Replacing all new lines with comma
      const preparedStr = stmt.replace(/(\r\n|\n|\r)/gm, delimiter);

      const rex = /\s*([a-zA-Z0-9\_]+\s*\:\s*[\!a-zA-Z]*\s*\,*[\r\n]*)/g;
      const rexEnum = /\s*([a-zA-Z0-9\_]+)\s*\,*/g;
      const splittedStr = preparedStr.split(rex);
      const enumBlocks: string[] = [];

      splittedStr.forEach(str => {
        if (!rex.test(str)) {
          // Parse enum without defined values
          const splitted = str.split(rexEnum);
          const removedCommaTrailSpcs = removeCommaAndTrailingSpaces(splitted);
          const cleaned = removedCommaTrailSpcs.filter(s => s.length > 0);

          if (cleaned.length > 0) {
            enumBlocks.push(...cleaned);
          }
        } else {
          // enum with defined values
          enumBlocks.push(RCTS(str));
        }
      });

      if (enumBlocks.length > 0) {
        enumBlocks.forEach(block => {
          const rexComma = /[a-zA-Z0-9\_]+\s*\:\s*[a-zA-Z0-9\_]+/g;
          if (rexComma.test(block)) {
            const keyValEnum = block.split(":");
            pairs[RCTS(keyValEnum[0]).toUpperCase()] = RCTS(keyValEnum[1]);
          } else {
            const upperBlock = block.toUpperCase();
            // Check predefined values to assign the custom value binding
            if (/[a-zA-Z0-9\_]+\s*\:/g.test(block)) {
              const keyEnum = upperBlock.replace(":", "");
              pairs[keyEnum] = bindings[bindIdx];
              bindIdx++;
            } else {
              pairs[upperBlock] = upperBlock;
            }
          }
        });
      }
    });

  return pairs;
}

function emptyValidator(strings: TemplateStringsArray | string) {
  if (isUndefined(strings)) {
    throw new Error("You need to define a schema");
  }
  if (strings.length === 1) {
    const s = strings[0].replace(/(\s)/gm, "");
    if (s.length === 0) {
      throw new Error("You need to define a schema");
    }
  }
}

function RCTS(s: string) {
  return s.replace(/\,/g, "").trim();
}

function removeCommaAndTrailingSpaces(strings: string[]) {
  return strings.map(RCTS);
}
