import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { DeleteActionInput } from "../../types/Expressions";

/**
 * Remove one or more elements from a `Set`
 */
export class DeleteAction extends UpdateAction {
  constructor(private input: DeleteActionInput<any>) {
    super("DELETE");
  }

  render(attributeMap: AttributeMap): string | null {
    const pathKey = attributeMap.addName(this.input.attrPath);
    const valueKey = attributeMap.addValue(this.input.attrPath, this.input.toRemove);

    if (!pathKey || !valueKey) return null;

    return `${pathKey} ${valueKey}`;
  }
}
