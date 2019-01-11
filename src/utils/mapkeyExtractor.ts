"use strict";

import { hasMappingKey } from "./detector";

/**
 * Extracting map->key
 * this function will returns a new key based on mapKey pattern if it found
 * @param {*} key
 */
export function extractMapKey(key: string) {
  let mapKey: string[] = [null, null];
  if (hasMappingKey(key)) {
    const splittedKeys = key.split(/\-\>/g);
    if (splittedKeys.length > 1) {
      mapKey = [splittedKeys[0], splittedKeys[1]];
    }
  }
  return mapKey;
}
