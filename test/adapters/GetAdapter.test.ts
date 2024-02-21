import { GetAdapter } from "../../src/adapters/GetAdapter";

import { DocClient } from "../TestSetup";
import { User, UserTableProps } from "../TestData";

test("T1: Fetch by partition key only", async () => {
  const storedUser = await addUser({ username: "UserA" });
  const fetchedUser = await new GetAdapter<User>(DocClient, UserTableProps).get(storedUser.userId).call();

  expect(fetchedUser).toEqual(storedUser);
});

test("T2: Fetch and projection", async () => {
  const storedUser = await addUser({ username: "UserA" });
  const fetchedUser = await new GetAdapter<User>(DocClient, UserTableProps).get(storedUser.userId).select("createdAt", "username").call();

  expect(fetchedUser).toEqual({ username: storedUser.username, createdAt: storedUser.createdAt });
});

async function addUser(userOptions: Partial<User>) {
  const userItem = new User(userOptions);
  await DocClient.put({ TableName: UserTableProps.tableName, Item: userItem });

  return userItem;
}
