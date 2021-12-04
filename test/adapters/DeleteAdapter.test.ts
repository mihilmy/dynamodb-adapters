import { DeleteAdapter } from "../../src/adapters/DeleteAdapter";

import { User, UserTableProps } from "../TestData";
import { DocClient, UsersTable } from "../TestSetup";
import { validateUserIsDeleted } from "../TestUtils";

test("T1: Basic Delete", async () => {
  // Populate test user
  const user = new User({ username: "test-user" });
  const { userId } = await UsersTable.add(user);

  // Execute delete using the users primary key
  const oldUser = await new DeleteAdapter<User>(DocClient, UserTableProps).delete(user).call();
  expect(oldUser).toBeDefined();

  await validateUserIsDeleted(userId);
});

test("T2: Conditional Delete", async () => {
  // Populate the test user
  const user = new User({ username: "conditional-test-user", version: 1 });
  const { userId, version } = await UsersTable.add(user);
  // Conditional Delete if user.version > version. Expected: false
  const falseResult = await new DeleteAdapter<User>(DocClient, UserTableProps).delete(user).if("version", ">", version).call();
  expect(falseResult).toBeFalsy();

  // Conditional Delete if user.version = version. Expected: old item
  const oldUser = await new DeleteAdapter<User>(DocClient, UserTableProps).delete(user).if("version", "=", version).call();
  expect(oldUser).toEqual(user);

  await validateUserIsDeleted(userId);
});
