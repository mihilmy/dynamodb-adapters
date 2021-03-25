import { UpdateAction } from "./UpdateAction";
import { AttributeMap } from "../AttributeMap";

import { ArithmeticInput, AttributePath } from "../../types/Expressions";

/**
 * Arithmetic assignment operations: x = x + y
 */
export class MathFunction extends UpdateAction {
  constructor(private input: ArithmeticInput<any>) {
    super("SET");
  }

  render(attributeMap: AttributeMap): string | null {
    const pathKey = attributeMap.addName(this.input.attrPath);
    const operand1 = this.createOperandKey(attributeMap, this.input.operand1);
    const operand2 = this.createOperandKey(attributeMap, this.input.operand2);

    if (!pathKey || !operand1 || !operand2) return null;

    return `${pathKey} = ${operand1} ${this.input.operator} ${operand2}`;
  }

  private createOperandKey(attributeMap: AttributeMap, operand: AttributePath<any> | number) {
    return typeof operand === "number" ? attributeMap.addValue(this.input.attrPath, operand) : attributeMap.addName(operand);
  }
}
