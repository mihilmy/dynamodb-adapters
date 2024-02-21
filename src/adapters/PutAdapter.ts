import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";

import { PutBuilder } from "../expressions/PutBuilder";
import { PutInput, AttributePath } from "../types/Expressions";
import { TableProps } from "../types/Props";
import { Adapter, ConditionalPutOperator } from "../types/Adapter";
import { AttributeValueType } from "../types/Dynamo";

export class PutAdapter<T extends unknown> implements Adapter<T | false | undefined> {
  protected builder: PutBuilder<T>;
  protected putExpression: PutInput;

  constructor(
    protected docClient: DynamoDBDocument,
    protected tableProps: TableProps<T, string>
  ) {
    this.builder = new PutBuilder(tableProps);
    this.putExpression = { TableName: tableProps.tableName, ReturnValues: "ALL_OLD" } as PutInput;
  }

  async call() {
    // NOTE: Builder actually copies the expression into a new object
    this.putExpression = this.builder.build(this.putExpression);
    console.debug(this.putExpression);

    try {
      const { Attributes: oldItem } = await this.docClient.put(this.putExpression);
      return oldItem as T;
    } catch (_error) {
      // Swallow since this should not be treated as an error if the client configured an update expression
      if (_error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw _error;
    }
  }

  put(item: unknown): PutAdapter<T> {
    this.putExpression.Item = item as Record<string, unknown>;
    return this;
  }

  if(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): PutAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): PutAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): PutAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): PutAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): PutAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): PutAdapter<T>;
  if(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): PutAdapter<T> {
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

  andIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): PutAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): PutAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): PutAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): PutAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): PutAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): PutAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): PutAdapter<T> {
    this.builder.setConditional("AND");
    //@ts-expect-error method overloading
    return this.if(attrPath, operator, attrValue);
  }

  orIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): PutAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): PutAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): PutAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): PutAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): PutAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): PutAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): PutAdapter<T> {
    this.builder.setConditional("OR");
    //@ts-expect-error method overloading
    return this.if(attrPath, operator, attrValue);
  }
}
