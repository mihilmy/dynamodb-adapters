import { typedPath, TypedPathKey } from "typed-path";

import { AttributePath } from "./types/Expressions";

export function flattenPromises<T>(promiseList: Promise<T | T[]>[]) {
  return Promise.all(promiseList).then((list) => list.flat());
}

export function toPath<T = any>(path: AttributePath<T>, type: "list"): TypedPathKey[];
export function toPath<T = any>(path: AttributePath<T>, type: "string"): string;
export function toPath<T = any>(path: AttributePath<T>, type: "list" | "string") {
  const unifiedPath = typeof path === "string" ? typedPath<T>({}, [path]) : path;
  return type === "list" ? unifiedPath.$rawPath : unifiedPath.$path;
}
