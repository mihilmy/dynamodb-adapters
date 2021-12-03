import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { inspect } from "util";
import { User, UserTableProps } from "./TestData";

export const DocClient = new DocumentClient({ endpoint: "localhost:8000", sslEnabled: false, region: "us-east-1" });

class UserTable {
  async get(userId: string) {
    const { Item } = await DocClient.get({ TableName: UserTableProps.tableName, Key: { userId } }).promise();
    return Item as User;
  }

  async add(userOptions: Partial<User>) {
    const userItem = new User(userOptions);
    await DocClient.put({ TableName: UserTableProps.tableName, Item: userItem }).promise();

    return userItem as User;
  }

  async delete(user: Partial<User>) {
    await DocClient.delete({ TableName: UserTableProps.tableName, Key: { userId: user.userId } }).promise();
  }

  async list() {
    const { Items = [] } = await DocClient.scan({ TableName: "Users" }).promise();
    console.log(inspect(Items, false, null, true));
    return Items as User[];
  }
}

export const UsersTable = new UserTable();
