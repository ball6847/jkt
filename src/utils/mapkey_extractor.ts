"use strict";

import detector from "./detector";

/**
 * Extracting map->key
 * this function will returns a new key based on mapKey pattern if it found
 * @param {*} key
 */
const extractMapKey = (key: string) => {
  let mapKey: string[] = [null, null];
  const hasMappingKey = detector.hasMappingKey(key);
  if (hasMappingKey) {
    const splittedKeys = key.split(/\-\>/g);
    if (splittedKeys.length > 1) {
      mapKey = [splittedKeys[0], splittedKeys[1]];
    }
  }
  return mapKey;
};

export default extractMapKey;
