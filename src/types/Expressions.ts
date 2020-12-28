import { DocumentClient } from "aws-sdk/clients/dynamodb";

/******************************************************************************************************************************************
 *                                                  TYPE ALIASING FOR DOC CLIENT                                                          *
 ******************************************************************************************************************************************/

export type QueryInput = DocumentClient.QueryInput;
export type GetInput = DocumentClient.GetItemInput;
export type PutInput = DocumentClient.PutItemInput;
export type BatchGetInput = DocumentClient.BatchGetItemInput;
export type BatchPutInput = DocumentClient.BatchWriteItemInput;
export type ScanInput = DocumentClient.ScanInput;
export type ExpressionNameMap = DocumentClient.ExpressionAttributeNameMap;
export type ExpressionValueMap = DocumentClient.ExpressionAttributeValueMap;

/******************************************************************************************************************************************
 *                                                     VALID EXPRESSION OPERATORS                                                         *
 ******************************************************************************************************************************************/

export type ConditionalOperator = "AND" | "OR";
export type ComparisonOperator = "=" | "<>" | ">" | ">=" | "<" | "<=";
export type SortOrder = "ASC" | "DESC";

/******************************************************************************************************************************************
 *                                                     SIMPLE ATTRIBUTE MAP TYPES                                                         *
 ******************************************************************************************************************************************/

export type NameMap<T> = Record<keyof T, NameEntry<T>>;
export type ValueMap = Record<string, ValueEntry>;
export type NameEntry<T> = { mapKey: string; attrName: keyof T };
export type ValueEntry = { mapKey: string; attrValue: any };
