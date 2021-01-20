import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { TypedPathNode } from "typed-path";

import { AttributeValueType } from "./Dynamo";

/******************************************************************************************************************************************
 *                                                  TYPE ALIASING FOR DOC CLIENT                                                          *
 ******************************************************************************************************************************************/

export type QueryInput = DocumentClient.QueryInput;
export type GetInput = DocumentClient.GetItemInput;
export type PutInput = DocumentClient.PutItemInput;
export type UpdateInput = DocumentClient.UpdateItemInput;
export type BatchGetInput = DocumentClient.BatchGetItemInput;
export type BatchPutInput = DocumentClient.BatchWriteItemInput;
export type ScanInput = DocumentClient.ScanInput;
export type BatchRequests = BatchGetInput | BatchPutInput;
export type CommonInput = QueryInput & GetInput & PutInput & BatchGetInput & BatchPutInput & ScanInput & UpdateInput;
export type ExpressionNameMap = DocumentClient.ExpressionAttributeNameMap;
export type ExpressionValueMap = DocumentClient.ExpressionAttributeValueMap;

/******************************************************************************************************************************************
 *                                                  INTERNAL EXPRESSION OPERATORS                                                         *
 ******************************************************************************************************************************************/

export type ConditionalOperator = "AND" | "OR";
export type ComparisonOperator = "=" | "<>" | ">" | ">=" | "<" | "<=";
export type SortOrder = "ASC" | "DESC";
export type AttributePath<T> = TypedPathNode<T> | keyof T;

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
  attrValue: TypedPathNode<T> | any;
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
  attrValue: TypedPathNode<T> | any;
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
