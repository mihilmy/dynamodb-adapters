import { UpdateAdapter } from "../../src/adapters/UpdateAdapter";

import { DocClient } from "../TestSetup";
import { User, UserTableProps, $User } from "../TestData";

test("T1: Conditional Update Regression", async () => {
  const user = new User({ username: "omar", version: 1, skills: new Set(["Java", "Typescript"]) });
  // Simple case of storing a new user
  const result1 = await new UpdateAdapter<User>(DocClient, UserTableProps).update(user).if("version", "DoesNotExist").call();
  expect(result1).toBeUndefined();

  // Decrement the version back to an older one and attempt to write it
  user.version--;
  const result2 = await new UpdateAdapter<User>(DocClient, UserTableProps).update(user).if($User.version, "<=", user.version).call();
  expect(result2).toEqual(false);

  // Increment the version back and attempt to write it
  user.version++;
  const result3 = await new UpdateAdapter<User>(DocClient, UserTableProps).update(user).if($User.version, "<=", user.version).call();
  expect(result3).toEqual(user);
});

test("T2: Validate that unused variables are deleted", async () => {
  const user1 = new User({ username: "gualti", version: 1, skills: new Set(["Java"]) });
  const user2 = new User({ username: "omar", version: 1, skills: new Set(["Typescript"]) });
  // Simple case of storing a new user
  const result1 = await new UpdateAdapter<User>(DocClient, UserTableProps).update(user1).if("version", "DoesNotExist").update(user2).call();
  expect(result1).toBeUndefined();
});
