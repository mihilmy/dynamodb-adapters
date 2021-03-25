// @ts-ignore
import DynamoDBSet from "aws-sdk/lib/dynamodb/set";
import { typedPath, TypedPathKey } from "typed-path";

import { DynamoSetType } from "./types/Dynamo";
import { AttributePath } from "./types/Expressions";

export function flattenPromises<T>(promiseList: Promise<T | T[]>[]): Promise<T[]> {
  //@ts-ignore
  return Promise.all(promiseList).then((list) => list.flat());
}

export function toDynamoDBItem(item: any) {
  for (const [attrKey, attrValue] of Object.entries(item || {})) {
    item[attrKey] = attrValue instanceof Set ? new DynamoDBSet([...attrValue], { validate: true }) : attrValue;
  }
  return item;
}

export function fromDynamoItem<T>(item: any): T {
  for (const [attrKey, attrValue] of Object.entries<any>(item || {})) {
    item[attrKey] = isDynamoDBSet(attrValue) ? new Set(attrValue.values) : attrValue;
  }
  return item;
}

export function isDynamoDBSet(object: any): boolean {
  return typeof object === "object" && object?.wrapperName === "Set" && object?.values && object?.type in DynamoSetType;
}

export function toPath<T = any>(path: AttributePath<T>, type: "list"): TypedPathKey[];
export function toPath<T = any>(path: AttributePath<T>, type: "string"): string;
export function toPath<T = any>(path: AttributePath<T>, type: "list" | "string") {
  const unifiedPath = typeof path === "string" ? typedPath<T>({}, [path]) : path;
  return type === "list" ? unifiedPath.$rawPath : unifiedPath.$path;
}
