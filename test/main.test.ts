import { DynamoDBAdapter } from "../src/adapter";

import { DocClient } from "./TestSetup";
import { User, UserTableProps, $User } from "./TestData";
import { DefaultPutOptions } from "../src/defaults";

const adapter = new DynamoDBAdapter(DocClient, UserTableProps);

test("T1: Default uses the update operation", async () => {
  const user = new User({ username: "hacker0", version: 1 });
  const result1 = await adapter.write(user).call();
  expect(result1).toBeUndefined();
});

test("T2: Array of items uses batch put", async () => {
  const hackers = [new User({ username: "hacker1", version: 1 }), new User({ username: "hacker3", version: 1 })];
  const result1 = await adapter.write(hackers).call();

  result1.forEach((entry) => expect(entry).toBeUndefined());
});

test("T3: Override default to use put", async () => {
  const user = new User({ username: "hacker2", version: 1 });
  const result1 = await adapter.write(user, DefaultPutOptions).call();

  expect(result1).toBeUndefined();
});
