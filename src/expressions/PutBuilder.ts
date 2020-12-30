import { TableProps } from "../types/Props";
import { PutInput } from "../types/Expressions";
import { ExpressionsBuilder } from "./Builder";

export class PutBuilder<T> extends ExpressionsBuilder<T> {
  private conditionalPutExpression: string[] = [];

  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
    this.currentExpressionList = this.conditionalPutExpression;
  }

  build(putInput: PutInput) {
    const input = super.addCommonInputs<PutInput>(putInput);
    if (this.conditionalPutExpression.length !== 0) {
      input.ConditionExpression = this.conditionalPutExpression.join(" ");
    }

    console.debug(input);

    return input;
  }
}
