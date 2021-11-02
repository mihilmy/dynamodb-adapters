import { QueryAdapter } from "../../src/adapters/QueryAdapter";
import { toDynamoDBItem } from "../../src/utils";

import { DocClient } from "../TestSetup";
import { User, UserTableProps } from "../TestData";
import { AttributeValueType } from "../../src/types/Dynamo";

test("T1: Fetch by partition key only", async () => {
  const storedUser = await addUser({ username: "UserA" });
  const [fetchedUser] = await new QueryAdapter<User>(DocClient, UserTableProps).query(storedUser.userId).call();

  expect(fetchedUser).toEqual(storedUser);
});

test("T2: Fetch and projection", async () => {
  const storedUser = await addUser({ username: "UserA" });
  const [fetchedUser] = await new QueryAdapter<User>(DocClient, UserTableProps).query(storedUser.userId).select("createdAt", "username").call();

  expect(fetchedUser).toEqual({ username: storedUser.username, createdAt: storedUser.createdAt });
});

test("T3: Fetch and filter", async () => {
  const storedUser = await addUser({ username: "UserA", skills: new Set(["Java"]) });
  // prettier-ignore
  const [fetchedUser] = await new QueryAdapter<User>(DocClient, UserTableProps)
    .query(storedUser.userId)
    .andIf("createdAt", "<=", new Date().toISOString())
    .andIf("skills", "Contains", "Java")
    .andIf("locations", "AttributeType", AttributeValueType.List)
    .select("createdAt", "username")
    .call();

  expect(fetchedUser).toEqual({ username: storedUser.username, createdAt: storedUser.createdAt });
});

async function addUser(userOptions: Partial<User>) {
  const userItem = new User(userOptions);
  await DocClient.put({ TableName: UserTableProps.tableName, Item: toDynamoDBItem(userItem) }).promise();

  return userItem;
}

