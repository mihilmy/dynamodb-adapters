export enum DynamoErrorCode {
  CCF = "ConditionalCheckFailedException",
  Validation = "ValidationException"
}

export enum DynamoDBErrorMessage {
  InvalidUpdatePath = "The document path provided in the update expression is invalid for update",
  InvalidUpdateValue = "The provided expression refers to an attribute that does not exist in the item"
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
  List = "L"
}

export enum DynamoSetType {
  String = "String",
  Number = "Number",
  Binary = "Binary"
}

export type Key = string | number | Buffer;
