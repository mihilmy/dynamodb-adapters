import { TypedPathKey } from "typed-path";

import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { SetActionInput } from "../../types/Expressions";
import { toPath } from "../../utils";

/**
 * Basic SET assignment operation: x = y
 */
export class SetAction extends UpdateAction {
  private readonly lhs: TypedPathKey[];
  private rhs: any;
  private shiftAttempt: number = 0;

  constructor(private input: SetActionInput<any>) {
    super("SET");
    this.lhs = toPath(input.attrPath, "list");
    this.rhs = input.attrValue;
  }

  render(attributeMap: AttributeMap): string | null {
    this.shiftPath();
    const pathKey = attributeMap.addName({ $rawPath: this.lhs, $path: "_" });
    const valueKey = attributeMap.addValue(this.input.attrPath, this.rhs);

    if (!pathKey || !valueKey) return null;

    return `${pathKey} = ${valueKey}`;
  }

  private shiftPath() {
    this.shiftAttempt++;
    // Skip path update in case this is the first update attempt or if path shifting was not requested
    if (this.shiftAttempt === 1 || !this.input.shiftRequested || this.lhs.length <= 1 || this.isPath(this.rhs)) return;

    // Extract the current path key
    const currentPathKey = this.lhs.pop();
    // @ts-ignore its not possible for the current path key to be undefined
    this.rhs = typeof currentPathKey === "number" ? [this.rhs] : { [currentPathKey]: this.rhs };
  }
}
