import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AWSError } from "aws-sdk/lib/error";
import { TypedPathNode } from "typed-path";

import { PutBuilder } from "../expressions/PutBuilder";
import { fromDynamoItem, toDynamoDBItem } from "../utils";

import { PutInput } from "../types/Expressions";
import { TableProps } from "../types/Props";
import { Adapter, ConditionalPutOperator } from "../types/Adapter";
import { AttributeValueType, DynamoErrorCode } from "../types/Dynamo";

export class PutAdapter<T> implements Adapter<T | false | undefined> {
  protected builder: PutBuilder<T>;
  protected putExpression: PutInput;

  constructor(protected docClient: DocumentClient, protected tableProps: TableProps<T, string>) {
    this.builder = new PutBuilder(tableProps);
    this.putExpression = { TableName: tableProps.tableName, ReturnValues: "ALL_OLD" } as PutInput;
  }

  async call() {
    // NOTE: Builder actually copies the expression into a new object
    this.putExpression = this.builder.build(this.putExpression);
    console.debug(this.putExpression);

    try {
      const { Attributes: oldItem } = await this.docClient.put(this.putExpression).promise();
      return fromDynamoItem<T>(oldItem);
    } catch (_error) {
      const error = _error as AWSError;
      // Swallow since this should not be treated as an error if the client configured an update expression
      if (error.code === DynamoErrorCode.CCF) return false;

      throw error;
    }
  }

  put(item: T): PutAdapter<T> {
    this.putExpression.Item = toDynamoDBItem(item);
    return this;
  }

  if(attrPath: TypedPathNode<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): PutAdapter<T>;
  if(attrPath: TypedPathNode<T>, operator: "AttributeType", attrType: AttributeValueType): PutAdapter<T>;
  if(attrPath: TypedPathNode<T>, operator: "BeginsWith", substring: string): PutAdapter<T>;
  if(attrPath: TypedPathNode<T>, operator: "Contains", searchValue: string | number): PutAdapter<T>;
  if(attrPath: TypedPathNode<T>, operator: "Exists" | "DoesNotExist"): PutAdapter<T>;
  if(attrPath: TypedPathNode<T>, operator: "InList", valueList: (string | number)[]): PutAdapter<T>;
  if(attrPath: TypedPathNode<T>, operator: ConditionalPutOperator, attrValue?: any): PutAdapter<T> {
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

  andIf(attrPath: TypedPathNode<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): PutAdapter<T>;
  andIf(attrPath: TypedPathNode<T>, operator: "AttributeType", attrType: AttributeValueType): PutAdapter<T>;
  andIf(attrPath: TypedPathNode<T>, operator: "BeginsWith", substring: string): PutAdapter<T>;
  andIf(attrPath: TypedPathNode<T>, operator: "Contains", searchValue: string | number): PutAdapter<T>;
  andIf(attrPath: TypedPathNode<T>, operator: "Exists" | "DoesNotExist"): PutAdapter<T>;
  andIf(attrPath: TypedPathNode<T>, operator: "InList", valueList: (string | number)[]): PutAdapter<T>;
  andIf(attrPath: TypedPathNode<T>, operator: ConditionalPutOperator, attrValue?: any): PutAdapter<T> {
    this.builder.setConditional("AND");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }

  orIf(attrPath: TypedPathNode<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): PutAdapter<T>;
  orIf(attrPath: TypedPathNode<T>, operator: "AttributeType", attrType: AttributeValueType): PutAdapter<T>;
  orIf(attrPath: TypedPathNode<T>, operator: "BeginsWith", substring: string): PutAdapter<T>;
  orIf(attrPath: TypedPathNode<T>, operator: "Contains", searchValue: string | number): PutAdapter<T>;
  orIf(attrPath: TypedPathNode<T>, operator: "Exists" | "DoesNotExist"): PutAdapter<T>;
  orIf(attrPath: TypedPathNode<T>, operator: "InList", valueList: (string | number)[]): PutAdapter<T>;
  orIf(attrPath: TypedPathNode<T>, operator: ConditionalPutOperator, attrValue?: any): PutAdapter<T> {
    this.builder.setConditional("OR");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }
}
