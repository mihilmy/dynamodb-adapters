import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

// Adapter implementations
import { BatchDeleteAdapter } from "./adapters/BatchDeleteAdapter";
import { BatchPutAdapter } from "./adapters/BatchPutAdapter";
import { DeleteAdapter } from "./adapters/DeleteAdapter";
import { PutAdapter } from "./adapters/PutAdapter";
import { UpdateAdapter } from "./adapters/UpdateAdapter";

// Defaults and configuration values
import { DefaultUpdateOptions } from "./defaults";

// Data types used for wiring up a request
import { Adapter, DeleteRequest, PutWriteOption, ReadOptions, ReadRequest, UpdateWriteOption, WriteOptions, WriteRequest } from "./types/Adapter";
import { TableProps } from "./types/Props";

/**
 * Wrapper on top of the implemented adapters to simplify the choice and prop drilling required for setting up values
 */
export class DynamoDBAdapter<DataType extends {}, IndexName extends string = string> {
  constructor(private docClient: DynamoDBDocument, private tableProps: TableProps<DataType, IndexName>) {}

  read(items: ReadRequest<DataType>, options?: ReadOptions) {
    throw new Error("Reading not supporter yet 😢");
  }

  write(items: DataType, options?: UpdateWriteOption): UpdateAdapter<DataType>;
  write(items: DataType, options?: PutWriteOption): PutAdapter<DataType>;
  write(items: DataType[], options?: UpdateWriteOption): BatchPutAdapter<DataType>;
  write(items: DataType[], options?: PutWriteOption): BatchPutAdapter<DataType>;

  /**
   * Writes a item or items to DynamoDB using either PutItem, UpdateItem or BatchPutItem APIs. The method will detect if certain features
   * are used and will invoke the right API. Clients can specify the write options they wish to perform if they would like to override the
   * defaults.
   *
   * @param items items to be persisted in the database should be a JSON friendly object
   * @param options optional override options to customize the low level adapter used
   * @returns an adapter implementation that will support a write operation
   */
  write(items: WriteRequest<DataType>, options: WriteOptions = DefaultUpdateOptions): Adapter<any> {
    // NOTE: Its required to check for the arrays first since the typeof operator will return true for both arrays and objects
    if (Array.isArray(items)) {
      return new BatchPutAdapter<DataType>(this.docClient, this.tableProps).put(items);
    }

    if (typeof items === "object") {
      if (options.strategy === "Put") return new PutAdapter<DataType>(this.docClient, this.tableProps).put(items);
      if (options.strategy === "Update") return new UpdateAdapter<DataType>(this.docClient, this.tableProps).update(items);
    }

    throw new Error("Unable to resolve the write request to correct adapter, its likely you are not using the right options");
  }

  delete(items: DataType): DeleteAdapter<DataType>;
  delete(items: DataType[]): BatchDeleteAdapter<DataType>;

  /**
   * Deletes an item or items in DynamoDB using DeleteItem or BatchDeleteItem APIs. The method will detect the correct API to use depending
   * on the provided items
   *
   * @param items items to be deleted in dynamo. must include the partitionKey and sortKey to succeed
   * @returns an adapter implementation that will support a delete operation
   */
  delete(items: DeleteRequest<DataType>): Adapter<any> {
    if (Array.isArray(items)) {
      return new BatchDeleteAdapter<DataType>(this.docClient, this.tableProps).delete(items);
    }

    if (typeof items === "object") {
      return new DeleteAdapter<DataType>(this.docClient, this.tableProps).delete(items);
    }

    throw new Error("Unable to process the delete request");
  }
}
