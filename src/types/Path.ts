import { TypedPathKey } from "typed-path";

import { TypedPathNode } from "./Expressions";

export class PathExpression<T> {
  private readonly currentPathList: TypedPathKey[];
  private readonly pathId: string;
  public pathValue: any;

  constructor(path: TypedPathNode, value: any) {
    this.pathId = path.$rawPath.toString();
    this.currentPathList = path.$rawPath || [];
    this.pathValue = value || null;
  }

  shiftUp() {
    const currentPathKey = this.currentPathList.length === 1 ? this.currentPathList[0] : this.currentPathList.pop();
    if (!currentPathKey) {
      throw new Error("Failed to shift path update one level up, unexpectedly received an undefined path entry!");
    }

    if (typeof currentPathKey === "number") {
      this.pathValue = [this.pathValue];
    } else {
      this.pathValue = { [currentPathKey]: this.pathValue };
    }
  }
}
