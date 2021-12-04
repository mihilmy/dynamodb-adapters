import { TableProps } from "../types/Props";
import { DeleteInput } from "../types/Expressions";
import { ExpressionsBuilder } from "./Builder";

export class DeleteBuilder<T> extends ExpressionsBuilder<T> {
  private conditionalDeleteExpression: string[] = [];

  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
    this.currentExpressionList = this.conditionalDeleteExpression;
  }

  hasExpression() {
    return this.conditionalDeleteExpression.length !== 0;
  }

  build(deleteInput: DeleteInput) {
    const input = { ...deleteInput };
    if (this.hasExpression()) {
      input.ConditionExpression = this.conditionalDeleteExpression.join(" ");
    }

    return super.addCommonInputs<DeleteInput>(input);
  }
}
