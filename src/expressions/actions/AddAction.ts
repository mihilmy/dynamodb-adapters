import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { AddActionInput } from "../../types/Expressions";

/**
 * Arithmetic operation by adding values or appending elements to a `Set`
 */
export class AddAction extends UpdateAction {
  constructor(private input: AddActionInput<any>) {
    super("ADD");
  }

  render(attributeMap: AttributeMap): string | null {
    const pathKey = attributeMap.addName(this.input.attrPath);
    const valueKey = attributeMap.addValue(this.input.attrPath, this.input.attrValue);

    if (!pathKey || !valueKey) return null;

    return `${pathKey} ${valueKey}`;
  }
}
