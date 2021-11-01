import { TableProps } from "../types/Props";
import { ExpressionsBuilder } from "./Builder";
import { GetInput } from "../types/Expressions";

export class GetBuilder<T> extends ExpressionsBuilder<T> {
  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
  }

  build(getInput: GetInput): GetInput {
    return super.addCommonInputs<GetInput>(getInput);
  }
}
