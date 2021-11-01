import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { GetBuilder } from "../expressions/GetBuilder";
import { fromDynamoItem } from "../utils";

import { GetInput, AttributePath } from "../types/Expressions";
import { TableProps } from "../types/Props";
import { Adapter } from "../types/Adapter";
import { Key } from "../types/Dynamo";

export class GetAdapter<T> implements Adapter<T | undefined> {
  protected builder: GetBuilder<T>;
  protected getInput: GetInput;

  constructor(protected docClient: DocumentClient, protected tableProps: TableProps<T, string>) {
    this.builder = new GetBuilder(tableProps);
    this.getInput = { TableName: tableProps.tableName, Key: {} };
  }

  async call(): Promise<T | undefined> {
    const getInput = this.builder.build(this.getInput);
    console.debug(getInput);
    const { Item } = await this.docClient.get(getInput).promise();
    return fromDynamoItem<T>(Item);
  }

  get(partitionKey: Key, sortKey?: Key): GetAdapter<T> {
    this.getInput.Key[this.tableProps.partitionKey.name] = partitionKey;

    if (this.tableProps.sortKey && sortKey) {
      this.getInput.Key[this.tableProps.sortKey.name] = sortKey;
    }

    return this;
  }

  select(...attributesToProject: AttributePath<T>[]) {
    this.builder.projectAttributes(attributesToProject);
    return this;
  }

  consistent() {
    this.getInput.ConsistentRead = true;
    return this;
  }
}
