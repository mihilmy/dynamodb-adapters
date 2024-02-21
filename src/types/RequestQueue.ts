import { WriteRequest } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommandOutput } from "@aws-sdk/lib-dynamodb";

import { BatchDeleteInput, BatchPutInput, BatchRequests, BatchResponses, DeleteInput } from "./Expressions";
import { TableProps } from "./Props";

abstract class RequestQueue<Request extends BatchRequests, R = BatchResponses> {
  private batchRequestList: Request[] = [];
  protected maxBatchSize: number = 25;

  constructor(
    protected tableProps: TableProps<any, string>,
    items: any[]
  ) {
    this.initRequestQueue(items);
  }

  drain(callback: (request: Request) => Promise<BatchWriteCommandOutput>): Promise<R[]>[] {
    let request: Request | undefined;
    const promiseList = [];

    while ((request = this.batchRequestList.shift())) {
      // prettier-ignore
      const promise = callback(request).then((output) => this.handleResponse(output))
      promiseList.push(promise);
    }

    return promiseList;
  }

  protected abstract createRequest(item: any): WriteRequest;
  protected abstract setMaxBatchSize(): void;
  protected abstract handleResponse(output: BatchResponses): R[];

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

  private createChunk(items: any[], currentChunk: number): WriteRequest[] {
    const length = items.length;
    const itemList = [];
    let startIndex = currentChunk * this.maxBatchSize;
    const endIndex = Math.min(startIndex + this.maxBatchSize, length);

    while (startIndex < endIndex) itemList.push(this.createRequest(items[startIndex++]));

    return itemList;
  }
}

export class BatchPutQueue<R> extends RequestQueue<BatchPutInput, R> {
  protected handleResponse(output: BatchWriteCommandOutput) {
    this.enqueue(output.UnprocessedItems);

    return output.UnprocessedItems?.[this.tableProps.tableName]?.map((item) => item.PutRequest?.Item as R) ?? [];
  }

  protected createRequest(item: any): WriteRequest {
    return { PutRequest: { Item: item } };
  }

  protected setMaxBatchSize(): void {
    this.maxBatchSize = 25;
  }
}

export class BatchDeleteQueue<R> extends RequestQueue<BatchDeleteInput, R> {
  protected handleResponse(output: BatchWriteCommandOutput) {
    this.enqueue(output.UnprocessedItems);

    return output.UnprocessedItems?.[this.tableProps.tableName]?.map((item) => item.DeleteRequest?.Key as R) ?? [];
  }

  protected createRequest(item: any): WriteRequest {
    const DeleteRequest = { Key: {} } as DeleteInput;
    const partitionKey = this.tableProps.partitionKey.name;
    const sortKey = this.tableProps.sortKey?.name;

    DeleteRequest.Key[partitionKey] = item[partitionKey];

    if (sortKey && item[sortKey]) {
      DeleteRequest.Key[sortKey] = item[sortKey];
    }
    return { DeleteRequest };
  }

  protected setMaxBatchSize(): void {
    this.maxBatchSize = 25;
  }
}
