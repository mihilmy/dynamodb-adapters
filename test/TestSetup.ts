import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { inspect } from "util";
import { User, UserTableProps } from "./TestData";

export const DocClient = new DocumentClient({ endpoint: "localhost:8000", sslEnabled: false, region: "us-east-1" });

class UserTable {
  async get(userId: string) {
    const { Item } = await DocClient.get({ TableName: UserTableProps.tableName, Key: { userId } }).promise();
    return Item as User;
  }

  async list() {
    const { Items = [] } = await DocClient.scan({ TableName: "Users" }).promise();
    console.log(inspect(Items, false, null, true));
    return Items as User[];
  }
}

export const UsersTable = new UserTable();
