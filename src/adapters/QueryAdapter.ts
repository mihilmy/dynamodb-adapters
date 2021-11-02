import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { QueryBuilder } from "../expressions/QueryBuilder";
import { SortOrder, AttributePath, QueryInput } from "../types/Expressions";
import { AttributeValueType } from "../types/Dynamo";
import { TableProps } from "../types/Props";
import { Adapter, ConditionalPutOperator } from "../types/Adapter";

export class QueryAdapter<T> implements Adapter<T[]> {
  private builder: QueryBuilder<T>;
  private queryInput: QueryInput;

  constructor(protected docClient: DocumentClient, protected tableProps: TableProps<T, string>) {
    this.builder = new QueryBuilder(tableProps);
    this.queryInput = { TableName: tableProps.tableName } as QueryInput;
  }

  async call(): Promise<T[]> {
    const resultList = new Array<T>();
    const queryInput = this.builder.build(this.queryInput);
    console.debug(queryInput);

    do {
      const queryOutput = await this.docClient.query(queryInput).promise();

      // Adjust the exclusive start key for pagination support
      queryInput.ExclusiveStartKey = queryOutput.LastEvaluatedKey;
      resultList.push(...(queryOutput.Items as T[]));
    } while (queryInput.ExclusiveStartKey);

    return resultList;
  }

  query(partitionKey: any, sortKey?: any) {
    this.andIf(this.tableProps.partitionKey.name, "=", partitionKey);

    if (sortKey) {
      this.andIf(this.tableProps.sortKey?.name as any, "=", sortKey);
    }

    return this;
  }

  queryIndex<I extends string>(index: I, partitionKey: any, sortKey?: any) {
    this.builder.useIndexKeys(index);

    return this.query(partitionKey, sortKey);
  }

  if(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): QueryAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): QueryAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): QueryAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): QueryAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): QueryAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): QueryAdapter<T>;
  if(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): QueryAdapter<T> {
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

  andIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): QueryAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): QueryAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): QueryAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): QueryAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): QueryAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): QueryAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): QueryAdapter<T> {
    this.builder.setConditional("AND");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }

  orIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): QueryAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): QueryAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): QueryAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): QueryAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): QueryAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): QueryAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): QueryAdapter<T> {
    this.builder.setConditional("OR");
    //@ts-ignore
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

  select(...attributesToProject: AttributePath<T>[]): QueryAdapter<T> {
    this.builder.projectAttributes(attributesToProject);
    return this;
  }
}
