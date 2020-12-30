export function flattenPromises<T>(promiseList: Promise<T | T[]>[]): Promise<T[]> {
  //@ts-ignore
  return Promise.all(promiseList).then((list) => list.flat());
}
