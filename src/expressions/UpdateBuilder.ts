import { ExpressionsBuilder } from "./Builder";

import { TableProps } from "../types/Props";
import { AddActionInput, BaseExpression, DeleteActionInput, SetActionInput, UpdateInput } from "../types/Expressions";

export class UpdateBuilder<T> extends ExpressionsBuilder<T> {
  private conditionalExpression: string[] = [];
  private updateExpression: Record<string, Action> = {};

  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
    this.currentExpressionList = this.conditionalExpression;
  }

  /**
   * Use the SET action in an update expression to add one or more attributes to an item
   */
  useSetAction(input: SetActionInput<T>) {
    //prettier-ignore
    const valueKey = input.valueType === "Path" ?  this.attributeMap.addName(input.attrValue) : this.attributeMap.addValue(input.attrPath, input.attrValue);

    if (valueKey) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      this.updateExpression[pathKey] = new SetAction({ pathKey, valueKey });
    }
  }

  /**
   * Use the ADD action in an update expression to do math operations or append elements to a `Set`
   */
  useAddAction(input: AddActionInput<T>) {
    const valueKey = this.attributeMap.addValue(input.attrPath, input.attrValue);

    if (valueKey) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      this.updateExpression[pathKey] = new AddAction({ pathKey, valueKey });
    }
  }
  /**
   * Use the REMOVE action in an update expression to remove one or more attributes from an item
   */
  useRemoveAction(input: BaseExpression<T>) {
    const pathKey = this.attributeMap.addName(input.attrPath);
    this.updateExpression[pathKey] = new RemoveAction({ pathKey });
  }

  /**
   * Use the DELETE action in an update expression to remove one or more elements from a `Set`
   */
  useDeleteAction(input: DeleteActionInput<T>) {
    const valueKey = this.attributeMap.addValue(input.attrPath, input.toRemove);

    if (valueKey) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      this.updateExpression[pathKey] = new DeleteAction({ pathKey, valueKey });
    }
  }

  build(updateInput: UpdateInput) {
    const input = super.addCommonInputs<UpdateInput>(updateInput);
    if (this.conditionalExpression.length !== 0) {
      input.ConditionExpression = this.conditionalExpression.join(" ");
    }

    return input;
  }
}

interface Action {
  expr: string;
  // rawPath: TypedPathKey[];
  type: "SET" | "REMOVE" | "ADD" | "DELETE";
}

class SetAction implements Action {
  expr: string;
  type: "SET" = "SET";

  constructor(input: { pathKey: string; valueKey: string }) {
    this.expr = `${input.pathKey} = ${input.valueKey}`;
  }
}

class AddAction implements Action {
  expr: string;
  type: "ADD" = "ADD";

  constructor(input: { pathKey: string; valueKey: string }) {
    this.expr = `${input.pathKey} ${input.valueKey}`;
  }
}
class DeleteAction implements Action {
  expr: string;
  type: "DELETE" = "DELETE";

  constructor(input: { pathKey: string; valueKey: string }) {
    this.expr = `${input.pathKey} ${input.valueKey}`;
  }
}
class RemoveAction implements Action {
  expr: string;
  type: "REMOVE" = "REMOVE";

  constructor(input: { pathKey: string }) {
    this.expr = `${input.pathKey}`;
  }
}
