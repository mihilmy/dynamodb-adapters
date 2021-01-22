import { ComparisonOperator } from "./Expressions";

export interface Adapter<R> {
  call(): Promise<R>;
}

export type ConditionalPutOperator = ComparisonOperator | "Exists" | "DoesNotExist" | "BeginsWith" | "Contains" | "AttributeType" | "InList";
export type WriteStrategy = "Put" | "Update";
export type ReadStrategy = "Tokenized" | "All";

export type WriteRequest<DataType> = DataType | DataType[];
export type ReadRequest<DataType> = Partial<DataType> | Partial<DataType>[] | "All";
export type DeleteRequest<DataType> = Partial<DataType> | Partial<DataType>[] | "All";

export interface ReadOptions {
  strategy: ReadStrategy;
}

export interface WriteOptions {
  strategy: WriteStrategy;
}

export interface PutWriteOption extends WriteOptions {
  strategy: "Put";
}

export interface UpdateWriteOption extends WriteOptions {
  strategy: "Update";
}
