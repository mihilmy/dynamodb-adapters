import * as DynamoDbClient from "@aws-sdk/lib-dynamodb";
import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

import { TypedPathKey } from "typed-path";

import { AttributeValueType } from "./Dynamo";

export type NonNullableFields<TObject> = {
  [Key in keyof TObject]: NonNullable<TObject[Key]>;
}

type MakeRequiredFields<TObject, TFields extends keyof TObject> = Omit<TObject, TFields> & NonNullableFields<Pick<TObject, TFields>>;

/******************************************************************************************************************************************
 *                                                  TYPE ALIASING FOR DOC CLIENT                                                          *
 ******************************************************************************************************************************************/

export type QueryInput = DynamoDbClient.QueryCommandInput;
export type GetInput = MakeRequiredFields<DynamoDbClient.GetCommandInput, "Key">;
export type PutInput = DynamoDbClient.PutCommandInput;
export type UpdateInput = MakeRequiredFields<DynamoDbClient.UpdateCommandInput, "Key">;
export type DeleteInput = MakeRequiredFields<DynamoDbClient.DeleteCommandInput, "Key">;
export type BatchGetInput = DynamoDbClient.BatchGetCommandInput;
export type BatchPutInput = DynamoDbClient.BatchWriteCommandInput;
export type BatchDeleteInput = DynamoDbClient.BatchWriteCommandInput;
export type ScanInput = DynamoDbClient.ScanCommandInput;
export type BatchRequests = BatchGetInput | BatchPutInput | BatchDeleteInput;
export type CommonInput = QueryInput & GetInput & PutInput & BatchGetInput & BatchPutInput & BatchDeleteInput & ScanInput & UpdateInput;
export type BatchResponses = DynamoDbClient.BatchGetCommandOutput | DynamoDbClient.BatchWriteCommandOutput;
export type ExpressionNameMap = Record<string, string>;
export type ExpressionValueMap = Record<string, NativeAttributeValue>;

/******************************************************************************************************************************************
 *                                                  INTERNAL EXPRESSION OPERATORS                                                         *
 ******************************************************************************************************************************************/

export type ConditionalOperator = "AND" | "OR";
export type ComparisonOperator = "=" | "<>" | ">" | ">=" | "<" | "<=";
export type SortOrder = "ASC" | "DESC";
export type UpdateActionType = "SET" | "ADD" | "REMOVE" | "DELETE";
export type AttributePath<T> = TypedPathNode | keyof T;
export type TypedPathNode = {
  $path: string;
  $rawPath: TypedPathKey[];
};

export interface BaseExpression<T> {
  attrPath: AttributePath<T>;
}

export interface ComparisonExpressionInput<T> extends BaseExpression<T> {
  comparison: ComparisonOperator;
  attrValue: string | number;
}

export interface ExistenceCheckerInput<T> extends BaseExpression<T> {
  exists: boolean;
}

export interface BeginsWithInput<T> extends BaseExpression<T> {
  substring: string;
}

export interface InListInput<T> extends BaseExpression<T> {
  values: (string | number)[];
}

export interface BetweenInput<T> extends BaseExpression<T> {
  lowerBound: string | number;
  upperBound: string | number;
}

export interface ContainsInput<T> extends BaseExpression<T> {
  searchValue: string | number;
}

export interface AttributeTypeCheck<T> extends BaseExpression<T> {
  type: AttributeValueType;
}

export interface SetActionInput<T> extends BaseExpression<T> {
  attrValue: TypedPathNode | any;
  shiftRequested?: boolean;
}

export interface ListAppendInput<T> extends BaseExpression<T> {
  list1: AttributePath<T> | Array<any>;
  list2: AttributePath<T> | Array<any>;
  position: "Start" | "End";
}

export interface ArithmeticInput<T> extends BaseExpression<T> {
  operand1: AttributePath<T> | number;
  operator: "+" | "-";
  operand2: AttributePath<T> | number;
}

export interface IfNotExistsInput<T> extends BaseExpression<T> {
  pathToCheck: AttributePath<T>;
  attrValue: TypedPathNode | any;
}

export interface AddActionInput<T> extends BaseExpression<T> {
  attrValue: number | Set<string | number>;
}

export interface DeleteActionInput<T> extends BaseExpression<T> {
  toRemove: Set<string | number>;
}
/******************************************************************************************************************************************
 *                                                     SIMPLE ATTRIBUTE MAP TYPES                                                         *
 ******************************************************************************************************************************************/

export type NameMap = Record<string, NameEntry>;
export type ValueMap = Record<string, ValueEntry>;
export type NameEntry = { mapKey: string; attrName: string };
export type ValueEntry = { mapKey: string; attrValue: any };
