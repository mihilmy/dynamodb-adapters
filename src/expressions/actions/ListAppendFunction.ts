import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { AttributePath, ListAppendInput } from "../../types/Expressions";

/**
 * Appends list function: x = list_append(w, y)
 */
export class ListAppendFunction extends UpdateAction {
  constructor(private input: ListAppendInput<any>) {
    super("SET");
  }

  render(attributeMap: AttributeMap): string | null {
    const pathKey = attributeMap.addName(this.input.attrPath);
    const listKey1 = this.createParameterKey(attributeMap, this.input.list1);
    const listKey2 = this.createParameterKey(attributeMap, this.input.list2);
    const orderedParams = this.input.position === "End" ? `${listKey2}, ${listKey1}` : `${listKey1}, ${listKey2}`;

    if (!pathKey || !listKey1 || !listKey2) return null;

    return this.input.position === "End" ? `${pathKey} = list_append(${orderedParams})` : `${pathKey} = list_append(${orderedParams})`;
  }

  private createParameterKey(attributeMap: AttributeMap, listEntry: AttributePath<any> | Array<any>) {
    return Array.isArray(listEntry) ? attributeMap.addValue(this.input.attrPath, listEntry) : attributeMap.addName(listEntry);
  }
}
