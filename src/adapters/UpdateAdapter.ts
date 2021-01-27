import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AWSError } from "aws-sdk/lib/error";

import { UpdateBuilder } from "../expressions/UpdateBuilder";
import { fromDynamoItem, toPath } from "../utils";

import { AttributePath, UpdateInput } from "../types/Expressions";
import { TableProps } from "../types/Props";
import { Adapter, ConditionalPutOperator } from "../types/Adapter";
import { AttributeValueType, DynamoErrorCode } from "../types/Dynamo";

export class UpdateAdapter<T> implements Adapter<T | false | undefined> {
  protected builder: UpdateBuilder<T>;
  protected updateInput: UpdateInput;

  constructor(protected docClient: DocumentClient, protected tableProps: TableProps<T, string>) {
    this.builder = new UpdateBuilder(tableProps);
    this.updateInput = { TableName: tableProps.tableName, ReturnValues: "ALL_OLD", Key: {} } as UpdateInput;
  }

  async call() {
    // NOTE: Builder actually copies the expression into a new object
    this.updateInput = this.builder.build(this.updateInput);
    console.debug(this.updateInput);

    try {
      const { Attributes: oldItem } = await this.docClient.update(this.updateInput).promise();
      return fromDynamoItem<T>(oldItem);
    } catch (_error) {
      const error = _error as AWSError;
      // Swallow since this should not be treated as an error if the client configured an update expression
      if (error.code === DynamoErrorCode.CCF) return false;

      throw error;
    }
  }

  update(item: Partial<T>): UpdateAdapter<T> {
    const partitionKeyName = this.tableProps.partitionKey["name"];
    const sortKeyName = this.tableProps.sortKey?.["name"];

    for (const [attrKey, attrValue] of Object.entries(item)) {
      // Add the tables primary keys to the Key object instead of the update expression
      if (partitionKeyName === attrKey || sortKeyName === attrKey) {
        this.updateInput.Key[attrKey] = attrValue;
      } else {
        this.builder.useSetAction({ attrPath: attrKey as keyof T, attrValue });
      }
    }

    return this;
  }

  once(attrPath: AttributePath<T>, value: any) {
    this.builder.useIfNotExists({ attrPath, pathToCheck: attrPath, attrValue: value });
    return this;
  }

  append(attrPath: AttributePath<T>, values: Set<string | number> | Array<any>, position: "Start" | "End" = "End") {
    if (values instanceof Set) {
      this.builder.useAddAction({ attrPath, attrValue: values });
    }

    if (Array.isArray(values)) {
      this.builder.useListAppend({ attrPath, list1: attrPath, list2: values, position });
    }

    return this;
  }

  addNumber(attrPath: AttributePath<T>, value: number | AttributePath<T>) {
    const pathLength = toPath(attrPath, "list").length;

    if (pathLength === 1 && typeof value === "number") {
      this.builder.useAddAction({ attrPath, attrValue: value });
    } else {
      this.builder.useMath({ attrPath, operand1: attrPath, operator: "+", operand2: value });
    }

    return this;
  }

  delete(attrPath: AttributePath<T>, values?: Set<string | number>) {
    if (values instanceof Set) {
      this.builder.useDeleteAction({ attrPath, toRemove: values });
    } else {
      this.builder.useRemoveAction({ attrPath });
    }

    return this;
  }

  if(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): UpdateAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): UpdateAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): UpdateAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): UpdateAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): UpdateAdapter<T>;
  if(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): UpdateAdapter<T>;
  if(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): UpdateAdapter<T> {
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

  andIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): UpdateAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): UpdateAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): UpdateAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): UpdateAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): UpdateAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): UpdateAdapter<T>;
  andIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): UpdateAdapter<T> {
    this.builder.setConditional("AND");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }

  orIf(attrPath: AttributePath<T>, operator: "<" | "<=" | "<>" | "=" | ">" | ">=", attrValue: string | number): UpdateAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "AttributeType", attrType: AttributeValueType): UpdateAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "BeginsWith", substring: string): UpdateAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Contains", searchValue: string | number): UpdateAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "Exists" | "DoesNotExist"): UpdateAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: "InList", valueList: (string | number)[]): UpdateAdapter<T>;
  orIf(attrPath: AttributePath<T>, operator: ConditionalPutOperator, attrValue?: any): UpdateAdapter<T> {
    this.builder.setConditional("OR");
    //@ts-ignore
    return this.if(attrPath, operator, attrValue);
  }
}
