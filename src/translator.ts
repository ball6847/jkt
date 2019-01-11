import { isFunction } from "./utils/detector";

export function customValueTranslator(callbackFunc) {
  if (!isFunction(callbackFunc)) {
    throw new TypeError(
      "You have to supply callback function with one parameter as given value to translate",
    );
  }

  // tslint:disable-next-line:no-empty
  function translateFunc() {}

  translateFunc.isJKTTRANSLATOR = true;
  translateFunc.translate = value => callbackFunc(value);

  return translateFunc;
}
