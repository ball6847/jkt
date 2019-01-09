import detector from "./detector";
import parserUtil from "./parser";
import serializerUtil from "./serializer";

const makeUtils = (schema: any) => {
  return {
    parse: parserUtil(schema),
    serialize: serializerUtil(schema),
    detect: detector,
  };
};

export = makeUtils;
