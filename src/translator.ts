import detector from "./utils/detector";

const customValueTranslator = callbackFunc => {
  if (!detector.isFunction(callbackFunc)) {
    throw new TypeError(
      "You have to supply callback function with one parameter as given value to translate",
    );
  }

  // tslint:disable-next-line:no-empty
  function translateFunc() {}

  translateFunc.isJKTTRANSLATOR = true;
  translateFunc.translate = value => {
    return callbackFunc(value);
  };

  return translateFunc;
};

export default {
  custom: customValueTranslator,
};
