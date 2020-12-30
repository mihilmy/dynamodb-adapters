import { BatchWriteItemRequestMap, DocumentClient, Key, KeysAndAttributes, PutRequest, WriteRequest } from "aws-sdk/clients/dynamodb";

import { PutAdapter } from "./PutAdapter";

import { TableProps } from "../types/Props";
import { BatchPutInput } from "../types/Expressions";
import { BatchPutQueue } from "../types/RequestQueue";
import { flattenPromises } from "../utils";

export class BatchPutAdapter<T> extends PutAdapter<T> {
  private items: T[] = [];
  private returnValuesRequested: boolean = false;

  constructor(docClient: DocumentClient, tableProps: TableProps<T, string>) {
    super(docClient, tableProps);
  }

  //@ts-ignore
  async call(): Promise<(T | false | undefined)[]> {
    let promiseList;

    if (this.builder.hasExpression() || this.returnValuesRequested) {
      // Perform a parallel put meaning we will do super.call() and aggregate responses in a promise list
      promiseList = this.items.map((item) => {
        super.put(item);
        return super.call();
      });
    } else {
      // Perform a BatchPut by partitioning requests into 25 request chunks
      const requestQueue = new BatchPutQueue<T>(this.tableProps, this.items);
      promiseList = requestQueue.drain((request: BatchPutInput) => this.docClient.batchWrite(request));
    }

    return flattenPromises(promiseList);
  }

  returnOldValues(): BatchPutAdapter<T> {
    this.returnValuesRequested = true;
    return this;
  }

  //@ts-ignore
  put(items: T[]): BatchPutAdapter<T> {
    this.items = items;
    return this;
  }
}
