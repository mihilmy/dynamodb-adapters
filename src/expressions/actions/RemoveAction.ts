import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { BaseExpression } from "../../types/Expressions";

/**
 * Removes one or more attributes from an item
 */
export class RemoveAction extends UpdateAction {
  constructor(private input: BaseExpression<any>) {
    super("REMOVE");
  }

  render(attributeMap: AttributeMap): string | null {
    const pathKey = attributeMap.addName(this.input.attrPath);

    if (!pathKey) return null;

    return `${pathKey}`;
  }
}
