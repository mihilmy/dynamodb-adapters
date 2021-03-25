import { AttributeMap } from "../AttributeMap";

import { UpdateActionType } from "../../types/Expressions";

/**
 * Base update action should extend all update expressions
 */
export abstract class UpdateAction {
  type: UpdateActionType;

  protected constructor(type: UpdateActionType) {
    this.type = type;
  }

  abstract render(attributeMap: AttributeMap): string | null;

  isPath(input: any) {
    return input?.$path && input?.$rawPath;
  }
}
