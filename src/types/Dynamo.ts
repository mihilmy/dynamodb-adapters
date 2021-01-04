import { DocumentClient } from "aws-sdk/clients/dynamodb";
const { createSet } = new DocumentClient();

export enum DynamoErrorCode {
  CCF = "ConditionalCheckFailedException",
}

export enum AttributeValueType {
  String = "S",
  StringSet = "SS",
  Number = "N",
  NumberSet = "NS",
  Binary = "B",
  BinarySet = "BS",
  Boolean = "BOOL",
  Null = "NULL",
  List = "L",
}

export class PersistedItem {
  [attrKey: string]: any;

  constructor(item: any) {
    for (const [attrKey, attrValue] of Object.entries(item)) {
      this[attrKey] = attrValue instanceof Set ? createSet([...attrValue], { validate: true }) : attrValue;
    }
  }
}
