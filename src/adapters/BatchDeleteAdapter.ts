import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

import { DeleteAdapter } from "./DeleteAdapter";
import { TableProps } from "../types/Props";
import { BatchDeleteInput } from "../types/Expressions";
import { BatchDeleteQueue } from "../types/RequestQueue";
import { flattenPromises } from "../utils";

export class BatchDeleteAdapter<T> extends DeleteAdapter<T> {
  private items: Partial<T>[] = [];
  private returnValuesRequested: boolean = false;

  constructor(docClient: DynamoDBDocument, tableProps: TableProps<T, string>) {
    super(docClient, tableProps);
  }

  // @ts-ignore
  async call(): Promise<(T | false | undefined | null | unknown)[]> {
    let promiseList;

    if (this.builder.hasExpression() || this.returnValuesRequested) {
      // Perform a parallel delete meaning we will do super.call() and aggregate responses in a promise list
      promiseList = this.items.map((item) => {
        super.delete(item);
        return super.call();
      });
    } else {
      // Perform a BatchPut by partitioning requests into 25 request chunks
      const requestQueue = new BatchDeleteQueue<T>(this.tableProps, this.items);
      promiseList = requestQueue.drain((request: BatchDeleteInput) => this.docClient.batchWrite(request));
    }

    return flattenPromises(promiseList);
  }

  returnOldValues(): BatchDeleteAdapter<T> {
    this.returnValuesRequested = true;
    return this;
  }

  //@ts-ignore
  delete(items: Partial<T>[]): BatchDeleteAdapter<T> {
    this.items = items;
    return this;
  }
}
