import { ExpressionsBuilder } from "./Builder";

import { UpdateAction } from "./actions/UpdateAction";
import { SetAction } from "./actions/SetAction";
import { MathFunction } from "./actions/MathFunction";
import { AddAction } from "./actions/AddAction";
import { RemoveAction } from "./actions/RemoveAction";
import { DeleteAction } from "./actions/DeleteAction";
import { ListAppendFunction } from "./actions/ListAppendFunction";
import { IfNotExistsFunction } from "./actions/IfNotExistsFunction";

import { TableProps } from "../types/Props";
import { AddActionInput, BaseExpression, DeleteActionInput, ListAppendInput, ArithmeticInput, IfNotExistsInput, SetActionInput, UpdateInput, UpdateActionType } from "../types/Expressions";

export class UpdateBuilder<T> extends ExpressionsBuilder<T> {
  private conditionalExpression: string[] = [];
  private updateExpression: Record<string, UpdateAction> = {};

  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
    this.currentExpressionList = this.conditionalExpression;
  }

  /**
   * Use the SET action in an update expression to add one or more attributes to an item
   */
  useSetAction(input: SetActionInput<T>) {
    this.updateExpression[input.attrPath.toString()] = new SetAction(input);
  }

  /**
   * Use the SET action in an update expression to add one or more attributes to an item
   */
  useListAppend(input: ListAppendInput<T>) {
    this.updateExpression[input.attrPath.toString()] = new ListAppendFunction(input);
  }

  /**
   * Uses the SET action to create an update expression using "+" or "-"
   */
  useIfNotExists(input: IfNotExistsInput<T>) {
    this.updateExpression[input.attrPath.toString()] = new IfNotExistsFunction(input);
  }

  /**
   * Uses the SET action to create an update expression using "+" or "-"
   */
  useMath(input: ArithmeticInput<T>) {
    this.updateExpression[input.attrPath.toString()] = new MathFunction(input);
  }

  /**
   * Use the ADD action in an update expression to do math operations or append elements to a `Set`
   */
  useAddAction(input: AddActionInput<T>) {
    this.updateExpression[input.attrPath.toString()] = new AddAction(input);
  }

  /**
   * Use the REMOVE action in an update expression to remove one or more attributes from an item
   */
  useRemoveAction(input: BaseExpression<T>) {
    this.updateExpression[input.attrPath.toString()] = new RemoveAction(input);
  }

  /**
   * Use the DELETE action in an update expression to remove one or more elements from a `Set`
   */
  useDeleteAction(input: DeleteActionInput<T>) {
    this.updateExpression[input.attrPath.toString()] = new DeleteAction(input);
  }

  build(updateInput: UpdateInput) {
    const input = { ...updateInput };

    if (this.conditionalExpression.length !== 0) {
      input.ConditionExpression = this.conditionalExpression.join(" ");
    }

    input.UpdateExpression = this.createUpdateExpression();

    return super.addCommonInputs<UpdateInput>(input);
  }

  private createUpdateExpression() {
    let updateExpression = "";
    const updateGroups: Record<UpdateActionType, string[]> = { SET: [], ADD: [], REMOVE: [], DELETE: [] };

    // Group all the rendered actions into a single array
    for (const updateAction of Object.values(this.updateExpression)) {
      const updateExpression = updateAction.render(this.attributeMap);
      // Only push the update expression if the render returns a value
      if (updateExpression) {
        updateGroups[updateAction.type].push(updateExpression);
      }
    }

    // Join all entries into a continuous string
    for (const [type, exprList] of Object.entries(updateGroups)) {
      // Not all update types will be populated
      if (exprList.length !== 0) {
        const separator = updateExpression ? " " : "";
        updateExpression += `${separator}${type} ${exprList.join(", ")}`;
      }
    }

    return updateExpression;
  }
}
