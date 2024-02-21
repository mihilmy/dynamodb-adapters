import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

import { QueryBuilder } from "../expressions/QueryBuilder";
import { SortOrder, AttributePath, QueryInput } from "../types/Expressions";
import { AttributeValueType } from "../types/Dynamo";
import { TableProps } from "../types/Props";
import { Adapter, ConditionalPutOperator } from "../types/Adapter";

export class QueryAdapter<T, I extends string> implements Adapter<T[]> {
  private builder: QueryBuilder<T>;
  private queryInput: QueryInput;

  constructor(
    protected docClient: DynamoDBDocument,
    protected tableProps: TableProps<T, I>
  ) {
    this.builder = new QueryBuilder(tableProps);
    this.queryInput = { TableName: tableProps.tableName } as QueryInput;
  }

  async call(): Promise<T[]> {
    const resultList = new Array<T>();
    const queryInput = this.builder.build(this.queryInput);
    console.debug(queryInput);

    do {
      const queryOutput = await this.docClient.query(queryInput);

      // Adjust the exclusive start key for pagination support
      queryInput.ExclusiveStartKey = queryOutput.LastEvaluatedKey;
      resultList.push(...(queryOutput.Items as T[]));
    } while (queryInput.ExclusiveStartKey);

    return resultList;
  }

  query(partitionKey: any, sortKey?: any) {
    this.andIf(this.builder.partitionKeyName, "=", partitionKey);

    if (sortKey) {
      this.andIf(this.builder.sortKeyName as any, "=", sortKey);
    }

    return this;
  }

  queryIndex(index: I, partitionKey: any, sortKey?: any) {
    this.queryInput.IndexName = index;
    this.builder.useIndexKeys(index);

    return this.query(partitionKey, sortKey);
  }

  if(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): QueryAdapter<T, I>;
  if(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): QueryAdapter<T, I>;
  if(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): QueryAdapter<T, I>;
  if(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): QueryAdapter<T, I>;
  if(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): QueryAdapter<T, I>;
  if(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): QueryAdapter<T, I>;
  if(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): QueryAdapter<T, I> {
    // In case the condition is on a sort key, we adjust the expression list to use the
    this.builder.setExpressionList(attrPath);
    switch (operator) {
      case "<":
      case "<=":
      case "<>":
      case "=":
      case ">":
      case ">=":
        this.builder.compare({ attrPath, attrValue, comparison: operator });
        break;
      case "AttributeType":
        this.builder.attributeType({ attrPath, type: attrValue });
        break;
      case "BeginsWith":
        this.builder.beginsWith({ attrPath, substring: attrValue });
        break;
      case "Contains":
        this.builder.contains({ attrPath, searchValue: attrValue });
        break;
      case "DoesNotExist":
        this.builder.existence({ attrPath, exists: false });
        break;
      case "Exists":
        this.builder.existence({ attrPath, exists: true });
        break;
      case "InList":
        this.builder.inList({ attrPath, values: attrValue });
        break;
      default:
        throw new Error("Invalid comparator operator");
    }
    return this;
  }

  andIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): QueryAdapter<T, I>;
  andIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): QueryAdapter<T, I>;
  andIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): QueryAdapter<T, I>;
  andIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): QueryAdapter<T, I>;
  andIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): QueryAdapter<T, I>;
  andIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): QueryAdapter<T, I>;
  andIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): QueryAdapter<T, I> {
    this.builder.setConditional("AND");
    // @ts-expect-error method overloading type issues
    return this.if(attrPath, operator, attrValue);
  }

  orIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): QueryAdapter<T, I>;
  orIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): QueryAdapter<T, I>;
  orIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): QueryAdapter<T, I>;
  orIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): QueryAdapter<T, I>;
  orIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): QueryAdapter<T, I>;
  orIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): QueryAdapter<T, I>;
  orIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): QueryAdapter<T, I> {
    this.builder.setConditional("OR");
    // @ts-expect-error method overloading type issues
    return this.if(attrPath, operator, attrValue);
  }

  limit(limit: number) {
    this.builder.setResultLimit(limit);
    return this;
  }

  sort(order: SortOrder) {
    this.builder.setSortOrder(order);
    return this;
  }

  select(...attributesToProject: AttributePath<T>[]): QueryAdapter<T, I> {
    this.builder.projectAttributes(attributesToProject);
    return this;
  }
}
