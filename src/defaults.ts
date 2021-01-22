import { PutWriteOption, UpdateWriteOption } from "./types/Adapter";

export const DefaultUpdateOptions: UpdateWriteOption = {
  strategy: "Update"
};

export const DefaultPutOptions: PutWriteOption = {
  strategy: "Put"
};
