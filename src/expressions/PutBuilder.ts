import { TableProps } from "../types/Props";
import { PutInput } from "../types/Expressions";
import { ExpressionsBuilder } from "./Builder";

export class PutBuilder<T> extends ExpressionsBuilder<T> {
  private conditionalPutExpression: string[] = [];

  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
    this.currentExpressionList = this.conditionalPutExpression;
  }

  hasExpression() {
    return this.conditionalPutExpression.length !== 0;
  }

  build(putInput: PutInput) {
    const input = { ...putInput };
    if (this.hasExpression()) {
      input.ConditionExpression = this.conditionalPutExpression.join(" ");
    }

    return super.addCommonInputs<PutInput>(input);
  }
}
