import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AWSError } from "aws-sdk/lib/error";

import { Adapter, ConditionalPutOperator } from "../types/Adapter";
import { TableProps } from "../types/Props";

import { DeleteBuilder } from "../expressions/DeleteBuilder";
import { AttributeValueType, DynamoErrorCode } from "../types/Dynamo";
import { AttributePath, DeleteInput } from "../types/Expressions";
import { fromDynamoItem } from "../utils";

export class DeleteAdapter<T> implements Adapter<T | false | undefined> {
  protected builder: DeleteBuilder<T>;
  protected deleteExpression: DeleteInput;

  constructor(protected docClient: DocumentClient, protected tableProps: TableProps<T, string>) {
    this.builder = new DeleteBuilder(tableProps);
    this.deleteExpression = { TableName: tableProps.tableName, Key: {}, ReturnValues: "ALL_OLD" } as DeleteInput;
  }

  async call() {
    // NOTE: Builder actually copies the expression into a new object
    this.deleteExpression = this.builder.build(this.deleteExpression);
    console.debug(this.deleteExpression);

    try {
      const { Attributes: oldItem } = await this.docClient.delete(this.deleteExpression).promise();
      return fromDynamoItem<T>(oldItem);
    } catch (_error) {
      const error = _error as AWSError;
      // Swallow since this should not be treated as an error if the client configured an update expression
      if (error.code === DynamoErrorCode.CCF) return false;

      throw error;
    }
  }

  delete(item: T): DeleteAdapter<T> {
    const partitionKey = this.tableProps.partitionKey.name;
    const sortKey = this.tableProps.sortKey?.name;
    this.deleteExpression.Key[partitionKey] = item[partitionKey];

    if (sortKey && item[sortKey]) {
      this.deleteExpression.Key[sortKey] = item[sortKey];
    }

    return this;
  }

  if(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): DeleteAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): DeleteAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): DeleteAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): DeleteAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): DeleteAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): DeleteAdapter<T>;
  if(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): DeleteAdapter<T> {
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

  andIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): DeleteAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): DeleteAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): DeleteAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): DeleteAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): DeleteAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): DeleteAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): DeleteAdapter<T> {
    this.builder.setConditional("AND");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }

  orIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): DeleteAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): DeleteAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): DeleteAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): DeleteAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): DeleteAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): DeleteAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): DeleteAdapter<T> {
    this.builder.setConditional("OR");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }
}
