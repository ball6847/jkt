import * as detector from "./detector";
import { parse } from "./parser";
import { serialize } from "./serializer";

// TODO: figure out typing for schema
export const makeUtils = (schema: any) => ({
  parse: parse(schema),
  serialize: serialize(schema),
  detect: detector,
});
