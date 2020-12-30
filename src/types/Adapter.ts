import { ComparisonOperator, SortOrder } from "./Expressions";

// prettier-ignore
export type ConditionalPutOperator = ComparisonOperator | "Exists" | "DoesNotExist" | "BeginsWith" | "Contains" | "AttributeType" | "InList";

export abstract class Adapter<R> {
  abstract call(): Promise<R>;
}
