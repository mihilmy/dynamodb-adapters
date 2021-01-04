import { BatchGetItemOutput, BatchWriteItemOutput, Key, WriteRequest } from "aws-sdk/clients/dynamodb";
import { AWSError } from "aws-sdk/lib/error";
import { PromiseResult, Request } from "aws-sdk/lib/request";

import { BatchRequests } from "./Expressions";
import { PersistedItem } from "./Dynamo";
import { TableProps } from "./Props";

abstract class RequestQueue<R = any> {
  private batchRequestList: BatchRequests[] = [];
  protected maxBatchSize: number = 25;

  constructor(protected tableProps: TableProps<any, string>, items: any[]) {
    this.initRequestQueue(items);
  }

  drain(callback: (request: any) => Request<any, AWSError>): Promise<R[]>[] {
    let request: BatchRequests | undefined;
    const promiseList = [];

    while ((request = this.batchRequestList.shift())) {
      // prettier-ignore
      const promise = callback(request).promise().then((output) => this.handleResponse(output))
      promiseList.push(promise);
    }

    return promiseList;
  }

  protected abstract createRequest(item: any): WriteRequest | Key;
  protected abstract setMaxBatchSize(): void;
  protected abstract handleResponse(output: BatchWriteItemOutput | BatchGetItemOutput): R[];

  protected enqueue(items?: BatchRequests["RequestItems"]) {
    if (!items?.[this.tableProps.tableName]) return 0;
    // @ts-ignore
    return this.batchRequestList.push({ RequestItems: items });
  }

  private initRequestQueue(items: any[]) {
    const numberOfChunks = Math.ceil(items.length / this.maxBatchSize);
    for (let i = 0; i < numberOfChunks; i++) {
      this.enqueue({ [this.tableProps.tableName]: this.createChunk(items, i) });
    }
  }

  private createChunk(items: any[], currentChunk: number): (WriteRequest | Key)[] {
    const length = items.length;
    const itemList = [];
    let startIndex = currentChunk * this.maxBatchSize;
    const endIndex = Math.min(startIndex + this.maxBatchSize, length);

    while (startIndex < endIndex) itemList.push(this.createRequest(items[startIndex++]));

    return itemList;
  }
}

export class BatchPutQueue<R> extends RequestQueue<R> {
  protected handleResponse(output: PromiseResult<BatchWriteItemOutput, AWSError>) {
    this.enqueue(output.UnprocessedItems);
    // @ts-ignore
    return output.UnprocessedItems?.[this.tableProps.tableName]?.map((item) => item.PutRequest?.Item as R) ?? [];
  }

  protected createRequest(item: any): WriteRequest {
    return { PutRequest: { Item: new PersistedItem(item) } };
  }

  protected setMaxBatchSize(): void {
    this.maxBatchSize = 25;
  }
}
