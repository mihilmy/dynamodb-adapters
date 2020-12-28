import { TypedPathNode } from "typed-path";
import { AttributeMap } from "./AttributeMap";
import { GlobalIndex, LocalIndex, TableProps } from "../types/Props";
import {
  ConditionalOperator,
  ComparisonExpressionInput,
  ExistenceCheckerInput,
  BeginsWithInput,
  BetweenInput,
  ContainsInput,
  AttributeTypeCheck,
  InListInput,
} from "../types/Expressions";

export class BaseBuilder<T> {
  protected tableName: string;
  protected partitionKeyName: keyof T;
  protected sortKeyName?: keyof T;
  protected attributeMap: AttributeMap = new AttributeMap();

  constructor(private tableProps: TableProps<T, string>) {
    this.tableName = tableProps.tableName;
    this.partitionKeyName = tableProps.partitionKey.name;
    this.sortKeyName = tableProps.sortKey?.name;
  }

  /**
   * Returns a comma separated string expression that identifies one or more attributes to retrieve from the table.
   *
   * @param selectedPaths item paths stored
   */
  protected projectAttributes(selectedPaths: TypedPathNode<T>[]) {
    return selectedPaths.map((path) => this.attributeMap.addName(path)).join(",");
  }

  /**
   * Creates a comparison expression using the basic >, <, =, <> operators defined in the expression types
   *
   * @param input comparison input
   */
  protected compare({ attrPath, attrValue, comparison, expressionList, conditional }: ComparisonExpressionInput<T>) {
    const expression = `${this.attributeMap.addName(attrPath)} ${comparison} ${this.attributeMap.addValue(attrPath, attrValue)}`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected existence({ exists, attrPath, expressionList, conditional }: ExistenceCheckerInput<T>) {
    const expression = `attribute_${exists ? "" : "not_"}exists(${this.attributeMap.addName(attrPath)})`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected beginsWith({ attrPath, substring, expressionList, conditional }: BeginsWithInput<T>) {
    const expression = `begins_with(${this.attributeMap.addName(attrPath)}, ${this.attributeMap.addValue(attrPath, substring)})`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected between({ attrPath, lowerBound, upperBound, expressionList, conditional }: BetweenInput<T>) {
    // prettier-ignore
    const expression = `${this.attributeMap.addName(attrPath)} BETWEEN ${this.attributeMap.addValue(attrPath, lowerBound)} AND ${this.attributeMap.addValue(attrPath, upperBound)}`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected inList({ attrPath, values, expressionList, conditional }: InListInput<T>) {
    // prettier-ignore
    const expression = `${this.attributeMap.addName(attrPath)} IN (${values.map(value => this.attributeMap.addValue(attrPath, value)).join(",")})`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected contains({ attrPath, searchValue, expressionList, conditional }: ContainsInput<T>) {
    const expression = `contains(${this.attributeMap.addName(attrPath)}, ${this.attributeMap.addValue(attrPath, searchValue)})`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected attributeType({ attrPath, type, expressionList, conditional }: AttributeTypeCheck<T>) {
    const expression = `attribute_type(${this.attributeMap.addName(attrPath)}, ${this.attributeMap.addValue(attrPath, type)})`;
    this.addExpression(expressionList, conditional, expression);
  }

  protected useIndexKeys(indexName: string) {
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

  protected addExpression(expression: string[], operator: ConditionalOperator, newExpression: string) {
    const length = expression.length;
    if (length === 0) {
      expression.push(newExpression);
    } else {
      expression.push(operator);
      expression.push(newExpression);
    }

    return this;
  }
}
