import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { inspect } from "util";
import { User, UserTableProps } from "./TestData";

export const DocClient = DynamoDBDocument.from(
  new DynamoDB({
    endpoint: "http://127.0.0.1:8000",
    region: "us-east-1",
    credentials: {
      accessKeyId: "fakeMyKeyId",
      secretAccessKey: "fakeSecretAccessKey"
    }
  })
);

class UserTable {
  async get(userId: string) {
    const { Item } = await DocClient.get({ TableName: UserTableProps.tableName, Key: { userId } });

    return Item as User;
  }

  async add(userOptions: Partial<User>) {
    const userItem = new User(userOptions);
    await DocClient.put({ TableName: UserTableProps.tableName, Item: userItem });

    return userItem as User;
  }

  async delete(user: Partial<User>) {
    await DocClient.delete({ TableName: UserTableProps.tableName, Key: { userId: user.userId } });
  }

  async list() {
    const { Items = [] } = await DocClient.scan({ TableName: "Users" });
    console.log(inspect(Items, false, null, true));
    return Items as User[];
  }
}

export const UsersTable = new UserTable();
