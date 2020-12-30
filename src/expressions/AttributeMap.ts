import { TypedPathKey, TypedPathNode } from "typed-path";
import { ExpressionNameMap, ExpressionValueMap, NameMap, ValueEntry, ValueMap } from "../types/Expressions";

const ATTRIBUTE_NAME_TOKEN = "#";
const ATTRIBUTE_VALUE_TOKEN = ":";

export class AttributeMap {
  private nameMap: NameMap = {};
  private valueMap: ValueMap = {};
  private valueCounter: number = 0;

  addName(path: TypedPathNode<any>) {
    return path.$raw.map((entry) => this.addNameEntry(entry)).join(".");
  }

  addValue(path: TypedPathNode<any>, attrValue: any) {
    if (attrValue === undefined || attrValue === null) return;

    const mapKey = `${value(path.$path)}${this.valueCounter++ || ""}`;
    this.valueMap[mapKey] = { mapKey, attrValue };
    return mapKey;
  }

  toExpressionAttributeNames(): ExpressionNameMap | undefined {
    const nameMap: ExpressionNameMap = {};
    const nameMapObjects = Object.values(this.nameMap);
    if (nameMapObjects.length === 0) return undefined;

    for (const { mapKey, attrName } of nameMapObjects) {
      nameMap[mapKey] = attrName as string;
    }

    return nameMap;
  }

  toExpressionAttributeValues(): ExpressionValueMap | undefined {
    const valueMap: ExpressionNameMap = {};
    const valueMapObjects = Object.values(this.valueMap) as ValueEntry[];
    if (valueMapObjects.length === 0) return undefined;

    for (const { mapKey, attrValue } of valueMapObjects) {
      valueMap[mapKey] = attrValue;
    }

    return valueMap;
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
