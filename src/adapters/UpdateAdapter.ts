import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException, DynamoDBServiceException } from "@aws-sdk/client-dynamodb";
import { TypedPathKey } from "typed-path";

import { UpdateBuilder } from "../expressions/UpdateBuilder";
import { toPath } from "../utils";

import { TableProps } from "../types/Props";
import { AttributePath, UpdateInput } from "../types/Expressions";
import { Adapter, ConditionalPutOperator } from "../types/Adapter";
import { AttributeValueType, DynamoDBErrorMessage, DynamoErrorCode } from "../types/Dynamo";

const MAX_JSON_DOCUMENT_DEPTH = 32;

export class UpdateAdapter<T> implements Adapter<T | false | undefined> {
  protected builder: UpdateBuilder<T>;
  protected updateInput: UpdateInput;
  protected isShiftRequested: boolean;
  protected retryCount: number = 0;

  constructor(
    protected docClient: DynamoDBDocument,
    protected tableProps: TableProps<T, string>
  ) {
    this.builder = new UpdateBuilder(tableProps);
    this.updateInput = { TableName: tableProps.tableName, ReturnValues: "ALL_OLD", Key: {} } as UpdateInput;
  }

  async call(): Promise<any> {
    // NOTE: Builder actually copies the expression into a new object
    this.updateInput = this.builder.build(this.updateInput);
    console.debug(this.updateInput);

    try {
      const { Attributes: oldItem } = await this.docClient.update(this.updateInput);
      return oldItem as T;
    } catch (_error) {
      // Swallow since this should not be treated as an error if the client configured an update expression
      if (_error instanceof ConditionalCheckFailedException) {
        return false;
      }

      // Specific edge case when we are updating nested paths within JSON documents which DynamoDB does not support directly
      const isPathUpdateFailure = _error instanceof DynamoDBServiceException && _error.name === DynamoErrorCode.Validation && _error.message === DynamoDBErrorMessage.InvalidUpdatePath;

      // Adds protection to avoid retrying endlessly this can be improved by using the builders max depth instead
      if (isPathUpdateFailure && this.isShiftRequested && this.retryCount++ < MAX_JSON_DOCUMENT_DEPTH) {
        return this.call();
      }

      throw _error;
    }
  }

  update(item: Partial<T>): UpdateAdapter<T> {
    for (const [attrKey, attrValue] of Object.entries(item)) {
      const path = attrKey as keyof T;
      this.updatePath(path, attrValue);
    }

    return this;
  }

  updatePath(path: AttributePath<T>, value: any, shiftOnFailure: boolean = false) {
    // Simple case if its a plain string path
    if (typeof path === "string") {
      return this.updateAttribute(path, value);
    }

    // Simple case if its a path with a single entry
    if (path.$rawPath.length === 1) {
      return this.updateAttribute(path.$rawPath[0], value);
    }

    // More complex case for nested path updates builder will be handling building expressions
    this.isShiftRequested = this.isShiftRequested || shiftOnFailure;
    this.builder.useSetAction({ attrPath: path, attrValue: value, shiftRequested: shiftOnFailure });
    return this;
  }

  private updateAttribute(attrName: TypedPathKey, attrValue: any) {
    const partitionKeyName = this.tableProps.partitionKey["name"];
    const sortKeyName = this.tableProps.sortKey?.["name"];
    const attrPath = attrName.toString() as keyof T;

    if (partitionKeyName === attrName || sortKeyName === attrName) {
      this.updateInput.Key[attrPath] = attrValue;
    } else {
      this.builder.useSetAction({ attrPath, attrValue });
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
