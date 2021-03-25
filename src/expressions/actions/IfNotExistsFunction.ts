import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { IfNotExistsInput } from "../../types/Expressions";

/**
 * Assignment of a particular attribute only if it does not exist
 */
export class IfNotExistsFunction extends UpdateAction {
  constructor(private input: IfNotExistsInput<any>) {
    super("SET");
  }

  render(attributeMap: AttributeMap): string | null {
    const pathKey = attributeMap.addName(this.input.attrPath);
    const pathToCheck = attributeMap.addName(this.input.pathToCheck);
    const valueKey = this.isPath(this.input.attrValue) ? attributeMap.addName(this.input.attrValue) : attributeMap.addValue(this.input.attrPath, this.input.attrValue);

    if (!pathKey || !pathToCheck || !valueKey) return null;

    return `${pathKey} = if_not_exists(${pathToCheck}, ${valueKey})`;
  }
}
