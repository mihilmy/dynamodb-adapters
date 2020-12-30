import { AttributeType } from "@aws-cdk/aws-dynamodb";
import { generate as uuid } from "short-uuid";
import { typedPath } from "typed-path";

import { TableProps } from "../src/types/Props";

export class User {
  userId: string;
  username!: string;
  version: number;

  constructor(user: Partial<User>) {
    this.userId = `user.id.${uuid()}`;
    this.version = 1;

    for (const override of Object.keys(user)) {
      //@ts-ignore
      this[override] = user[override];
    }
  }
}

export const UserTableProps: TableProps<User, string> = {
  tableName: "Users",
  partitionKey: { name: "userId", type: AttributeType.STRING },
};

export const $User = typedPath<User>();
