// @ts-ignore
import DynamoDBSet from "aws-sdk/lib/dynamodb/set";
import { TypedPathKey } from "typed-path";

import { ExpressionNameMap, ExpressionValueMap, NameMap, ValueEntry, ValueMap, AttributePath } from "../types/Expressions";
import { Optional } from "../types/Common";

const ATTRIBUTE_NAME_TOKEN = "#";
const ATTRIBUTE_VALUE_TOKEN = ":";

export class AttributeMap {
  private nameMap: NameMap = {};
  private valueMap: ValueMap = {};
  private valueCounter: number = 0;

  addName(path: AttributePath<any>) {
    const pathList = typeof path === "string" ? [path] : path.$raw;
    return pathList.map((entry) => this.addNameEntry(entry)).join(".");
  }

  addValue(path: AttributePath<any>, attrValue: any) {
    if (attrValue === undefined || attrValue === null) return;

    // Sets are treated as a special value by the SDK and they export a specific class to construct the `Set`
    if (attrValue instanceof Set) attrValue = new DynamoDBSet([...attrValue], { validate: true });

    const pathString = typeof path === "string" ? path : path.$path;
    const mapKey = `${value(pathString)}${this.valueCounter++ || ""}`;
    this.valueMap[mapKey] = { mapKey, attrValue };
    return mapKey;
  }

  toExpressionAttributeNames(expressions: Optional<string>[] = []): ExpressionNameMap | undefined {
    const nameMap: ExpressionNameMap = {};
    const nameMapObjects = Object.values(this.nameMap);
    if (nameMapObjects.length === 0) return undefined;

    // Build a unique token set using the expression attribute value placeholder
    const tokens = new Set<string>(expressions.flatMap((expr) => expr?.match(/#\w+/g) || []));
    for (const { mapKey, attrName } of nameMapObjects) {
      // Only add the map key if it exists in the expression
      if (tokens.has(mapKey)) nameMap[mapKey] = attrName;
    }

    return Object.keys(nameMap).length > 0 ? nameMap : undefined;
  }

  toExpressionAttributeValues(expressions: Optional<string>[] = []): ExpressionValueMap | undefined {
    const valueMap: ExpressionNameMap = {};
    const valueMapObjects = Object.values(this.valueMap) as ValueEntry[];
    if (valueMapObjects.length === 0) return undefined;

    // Build a unique token set using the expression attribute value placeholder
    const tokens = new Set<string>(expressions.flatMap((expr) => expr?.match(/:\w+/g) || []));
    for (const { mapKey, attrValue } of valueMapObjects) {
      // Only add the map key if it exists in the expression
      if (tokens.has(mapKey)) valueMap[mapKey] = attrValue;
    }

    return Object.keys(valueMap).length > 0 ? valueMap : undefined;
  }

  private addNameEntry(entry: TypedPathKey) {
    const attrName = entry.toString();
    const mapKey = name(attrName);
    this.nameMap[attrName] = { mapKey, attrName };
    return mapKey;
  }
}

export function name(attrName: string) {
  return `${ATTRIBUTE_NAME_TOKEN}${attrName}`;
}

export function value(attrName: string) {
  return `${ATTRIBUTE_VALUE_TOKEN}${attrName}`;
}
