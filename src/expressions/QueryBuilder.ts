import { TableProps } from "../types/Props";
import { ExpressionsBuilder } from "./Builder";
import { QueryInput, SortOrder, AttributePath } from "../types/Expressions";

export class QueryBuilder<T> extends ExpressionsBuilder<T> {
  protected keyExpression: string[] = [];
  protected filterExpression: string[] = [];
  protected scanIndexForward: boolean;

  constructor(tableProps: TableProps<T, string>) {
    super(tableProps);
  }

  setExpressionList(path: AttributePath<T>) {
    let attributeName;
    // Select an attribute name if the path is simple
    if (typeof path === "string") {
      attributeName = path;
    } else if (path.$rawPath.length === 1) {
      attributeName = path.$rawPath[0];
    }

    if (this.isKeyCondition(attributeName as keyof T)) {
      this.currentExpressionList = this.keyExpression; 
    } else {
      this.currentExpressionList = this.filterExpression;
    }
  }

  setSortOrder(sortOrder: SortOrder) {
    // Scan index forward is ascending by default
    this.scanIndexForward = sortOrder !== "DESC";
  }

  build(queryInput: QueryInput): QueryInput {
    queryInput.KeyConditionExpression = this.keyExpression.join(" ");

    if (this.filterExpression.length > 0) {
      queryInput.FilterExpression = this.filterExpression.join(" ");
    }

    if (this.scanIndexForward === false) {
      queryInput.ScanIndexForward = false;
    }

    return super.addCommonInputs<QueryInput>(queryInput);
  }
}
