export enum DynamoErrorCode {
  CCF = "ConditionalCheckFailedException"
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
