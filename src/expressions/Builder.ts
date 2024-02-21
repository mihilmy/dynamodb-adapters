import { AttributeMap } from "./AttributeMap";
import { GlobalIndex, LocalIndex, TableProps } from "../types/Props";
import { AttributePath, TypedPathNode } from "../types/Expressions";
import { ComparisonExpressionInput, ExistenceCheckerInput, BeginsWithInput, BetweenInput, ContainsInput, AttributeTypeCheck, InListInput, ConditionalOperator, CommonInput } from "../types/Expressions";

export abstract class ExpressionsBuilder<T> {
  public partitionKeyName: keyof T;
  public sortKeyName?: keyof T;

  // Common attribute map used by all expressions and building expressions
  protected attributeMap: AttributeMap = new AttributeMap();
  private conditionalOperator: ConditionalOperator = "AND";

  // Only available for Get/BatchGet/Query/Scan
  protected projectedSet: Set<string> = new Set();
  // Used to determine the current list to populate
  protected currentExpressionList!: string[];
  // Used to limit the number of items retruned from a Query or Scan
  protected limit: number;

  constructor(private tableProps: TableProps<T, string>) {
    this.partitionKeyName = tableProps.partitionKey.name;
    this.sortKeyName = tableProps.sortKey?.name;
  }

  /**
   * Creates a comparison expression using the basic >, <, =, <> operators defined in the expression types
   *
   * @param input comparison input
   */
  compare({ attrPath, attrValue, comparison }: ComparisonExpressionInput<T>) {
    const expression = `${this.attributeMap.addName(attrPath)} ${comparison} ${this.attributeMap.addValue(attrPath, attrValue)}`;
    this.addExpression(expression);
  }

  existence({ exists, attrPath }: ExistenceCheckerInput<T>) {
    const expression = `attribute_${exists ? "" : "not_"}exists(${this.attributeMap.addName(attrPath)})`;
    this.addExpression(expression);
  }

  beginsWith({ attrPath, substring }: BeginsWithInput<T>) {
    const expression = `begins_with(${this.attributeMap.addName(attrPath)}, ${this.attributeMap.addValue(attrPath, substring)})`;
    this.addExpression(expression);
  }

  between({ attrPath, lowerBound, upperBound }: BetweenInput<T>) {
    // prettier-ignore
    const expression = `${this.attributeMap.addName(attrPath)} BETWEEN ${this.attributeMap.addValue(attrPath, lowerBound)} AND ${this.attributeMap.addValue(attrPath, upperBound)}`;
    this.addExpression(expression);
  }

  inList({ attrPath, values }: InListInput<T>) {
    // prettier-ignore
    const expression = `${this.attributeMap.addName(attrPath)} IN (${values.map(value => this.attributeMap.addValue(attrPath, value)).join(",")})`;
    this.addExpression(expression);
  }

  contains({ attrPath, searchValue }: ContainsInput<T>) {
    const expression = `contains(${this.attributeMap.addName(attrPath)}, ${this.attributeMap.addValue(attrPath, searchValue)})`;
    this.addExpression(expression);
  }

  attributeType({ attrPath, type }: AttributeTypeCheck<T>) {
    const expression = `attribute_type(${this.attributeMap.addName(attrPath)}, ${this.attributeMap.addValue(attrPath, type)})`;
    this.addExpression(expression);
  }

  setConditional(operator: ConditionalOperator) {
    this.conditionalOperator = operator;
  }

  /**
   * Returns a comma separated string expression that identifies one or more attributes to retrieve from the table.
   *
   * @param selectedPaths item paths stored
   */
  projectAttributes(selectedPaths: AttributePath<T>[]) {
    for (const path of selectedPaths) {
      const pathExpression = this.attributeMap.addName(path);
      this.projectedSet.add(pathExpression);
    }
  }

  setResultLimit(limit: number) {
    this.limit = limit;
  }

  useIndexKeys(indexName: string) {
    if (!this.tableProps.indexMap?.[indexName]) {
      throw new Error("Index name has not been defined in tableProps.indexMap configuration");
    }

    const { indexType } = this.tableProps.indexMap[indexName];

    if (indexType === "Global") {
      const { partitionKey, sortKey } = this.tableProps.indexMap[indexName] as GlobalIndex<T, any>;
      this.partitionKeyName = partitionKey.name;
      this.sortKeyName = sortKey?.name;
    }

    if (indexType === "Local") {
      const { partitionKey } = this.tableProps;
      const { sortKey } = this.tableProps.indexMap[indexName] as LocalIndex<T, any>;
      this.partitionKeyName = partitionKey.name;
      this.sortKeyName = sortKey.name;
    }
  }

  protected isKeyCondition(attrName: keyof T) {
    return [this.partitionKeyName, this.sortKeyName].includes(attrName);
  }

  protected addExpression(newExpression: string) {
    const length = this.currentExpressionList.length;
    if (length === 0) {
      this.currentExpressionList.push(newExpression);
    } else {
      this.currentExpressionList.push(this.conditionalOperator);
      this.currentExpressionList.push(newExpression);
    }

    return this;
  }

  protected addCommonInputs<R extends Partial<CommonInput>>(baseInput: R) {
    const result: Partial<CommonInput> = { ...baseInput };
    // Add any common expressions BEFORE committing the attribute names and values
    if (this.limit) result.Limit = this.limit;
    if (this.projectedSet.size > 0) result.ProjectionExpression = [...this.projectedSet].join(",");

    // Addd the attribute names and values AFTER the expressions have been added
    const expressionsList = [result.ConditionExpression, result.FilterExpression, result.ProjectionExpression, result.UpdateExpression, result.KeyConditionExpression];
    const expressionAttributeNames = this.attributeMap.toExpressionAttributeNames(expressionsList);
    const expressionAttributeValues = this.attributeMap.toExpressionAttributeValues(expressionsList);

    if (expressionAttributeNames) result.ExpressionAttributeNames = expressionAttributeNames;
    if (expressionAttributeValues) result.ExpressionAttributeValues = expressionAttributeValues;
    
    return result as R;
  }
}
