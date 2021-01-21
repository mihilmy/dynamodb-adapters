import { ExpressionsBuilder } from "./Builder";

import { TableProps } from "../types/Props";
import { AddActionInput, BaseExpression, DeleteActionInput, ListAppendInput, ArithmeticInput, IfNotExistsInput, SetActionInput, UpdateInput } from "../types/Expressions";

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
    const isPath = input.attrValue.$path && input.attrValue.$raw;
    const valueKey = isPath ? this.attributeMap.addName(input.attrValue) : this.attributeMap.addValue(input.attrPath, input.attrValue);

    if (valueKey) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      this.updateExpression[pathKey] = new SetAction({ pathKey, value: valueKey });
    }
  }

  /**
   * Use the SET action in an update expression to add one or more attributes to an item
   */
  useListAppend(input: ListAppendInput<T>) {
    const listKey1 = Array.isArray(input.list1) ? this.attributeMap.addValue(input.attrPath, input.list1) : this.attributeMap.addName(input.list1);
    const listKey2 = Array.isArray(input.list2) ? this.attributeMap.addValue(input.attrPath, input.list2) : this.attributeMap.addName(input.list2);

    if (listKey1 && listKey2) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      this.updateExpression[pathKey] = new ListAppendFunction({ pathKey, list1: listKey1, list2: listKey2, position: input.position });
    }
  }

  /**
   * Uses the SET action to create an update expression using "+" or "-"
   */
  useIfNotExists(input: IfNotExistsInput<T>) {
    const isPath = input.attrValue.$path && input.attrValue.$raw;
    const valueKey = isPath ? this.attributeMap.addName(input.attrValue) : this.attributeMap.addValue(input.attrPath, input.attrValue);

    if (valueKey) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      const pathToCheck = this.attributeMap.addName(input.pathToCheck);
      this.updateExpression[pathKey] = new IfNotExistsFunction({ pathKey, pathToCheck, value: valueKey });
    }
  }

  /**
   * Uses the SET action to create an update expression using "+" or "-"
   */
  useMath(input: ArithmeticInput<T>) {
    const operand1 = typeof input.operand1 === "number" ? this.attributeMap.addValue(input.attrPath, input.operand1) : this.attributeMap.addName(input.operand1);
    const operand2 = typeof input.operand2 === "number" ? this.attributeMap.addValue(input.attrPath, input.operand2) : this.attributeMap.addName(input.operand2);

    if (operand1 && operand2) {
      const pathKey = this.attributeMap.addName(input.attrPath);
      this.updateExpression[pathKey] = new MathFunction({ pathKey, operand1, operator: input.operator, operand2 });
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
    const updateGroups: Record<Action["type"], string[]> = { SET: [], ADD: [], REMOVE: [], DELETE: [] };

    if (this.conditionalExpression.length !== 0) {
      input.ConditionExpression = this.conditionalExpression.join(" ");
    }

    for (const { type, expr } of Object.values(this.updateExpression)) {
      updateGroups[type].push(expr);
    }

    for (const [type, exprList] of Object.entries(updateGroups)) {
      if (exprList.length !== 0) {
        input.UpdateExpression ||= "";
        input.UpdateExpression += `${type} ${exprList.join(", ")}\n`;
      }
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

  constructor(input: { pathKey: string; value: string }) {
    this.expr = `${input.pathKey} = ${input.value}`;
  }
}

class ListAppendFunction extends SetAction {
  constructor(input: { pathKey: string; list1: string; list2: string; position: "Start" | "End" }) {
    const params = input.position === "Start" ? `${input.list2}, ${input.list1}` : `${input.list1}, ${input.list2}`;
    super({ pathKey: input.pathKey, value: `list_append(${params})` });
  }
}

class MathFunction extends SetAction {
  constructor(input: { pathKey: string; operand1: string; operator: "+" | "-"; operand2: string }) {
    super({ pathKey: input.pathKey, value: `${input.operand1} ${input.operator} ${input.operand2}` });
  }
}

class IfNotExistsFunction extends SetAction {
  constructor(input: { pathKey: string; pathToCheck: string; value: string }) {
    super({ pathKey: input.pathKey, value: `if_not_exists(${input.pathToCheck}, ${input.value})` });
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
