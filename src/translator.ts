import { isFunction } from "./utils/detector";

class CustomTranslator {
  constructor(public isJKTTRANSLATOR: boolean, public translate: (v: any) => any) {}
}

export function customValueTranslator(callbackFunc) {
  if (!isFunction(callbackFunc)) {
    throw new TypeError(
      "You have to supply callback function with one parameter as given value to translate",
    );
  }

  return new CustomTranslator(true, value => callbackFunc(value));
}
