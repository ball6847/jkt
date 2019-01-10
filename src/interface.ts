export interface IJktObject {
  __id: string | string[];
  __schema: unknown;
  isJKT: boolean;
  schema: unknown;
  childOf(parentStruct: IStruct): boolean;
  j(): any;
  getSchema(): unknown;
  getDirtySchema(): unknown;
  toJSON(): any;
  toString(): string;
  instanceOf(instance: IJktObject): boolean;
}

export interface IStruct {
  __id: string | string[];
  __schema: unknown;
  isJKT: boolean;
  schema: unknown;
  childOf(parentStruct: IStruct): boolean;
}
