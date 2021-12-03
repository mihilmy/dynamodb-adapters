import { BatchDeleteAdapter } from "../../src/adapters/BatchDeleteAdapter";

import { User, UserTableProps } from "../TestData";
import { DocClient, UsersTable } from "../TestSetup";
import { validateUserIsDeleted } from "../TestUtils";

const userA = new User({ username: "a", version: 1 });
const userB = new User({ username: "b", version: 1 });

beforeEach(async () => {
  await UsersTable.add(userA);
  await UsersTable.add(userB);
});

afterEach(async () => {
  await UsersTable.delete(userA);
  await UsersTable.delete(userB);
});

test("T1: Validate all failing batch delete", async () => {
  // Perform a batch delete expecting all conditional failures
  const result = await new BatchDeleteAdapter<User>(DocClient, UserTableProps).delete([userA, userB]).if("version", "DoesNotExist").call();
  expect(result).toEqual([false, false]);
});

test("T2: Validate partial failing batch delete", async () => {
  // Perform a batch delete with partial success
  const result = await new BatchDeleteAdapter<User>(DocClient, UserTableProps).delete([userA, userB]).if("username", "=", userA.username).call();
  expect(result).toEqual([userA, false]);
});

test("T3: Validate all success batch delete", async () => {
  // Perform a batch delete with all success
  const result = await new BatchDeleteAdapter<User>(DocClient, UserTableProps).delete([userA, userB]).returnOldValues().call();
  expect(result).toEqual([userA, userB]);
  await validateUserIsDeleted(userA.userId);
  await validateUserIsDeleted(userB.userId);
});
