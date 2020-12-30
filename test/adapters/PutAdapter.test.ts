import { PutAdapter } from "../../src/adapters/PutAdapter";

import { DocClient } from "../TestSetup";
import { User, UserTableProps, $User } from "../TestData";

test("T1: Conditional Put", async () => {
  const user = new User({ username: "omar", version: 1 });
  const result1 = await new PutAdapter<User>(DocClient, UserTableProps)
    .put(user)
    .if($User.version, "DoesNotExist")
    .orIf($User.version, "<=", user.version)
    .call();
  expect(result1).toBeUndefined();

  // Decrement the version back to an older one and attempt to write it
  user.version--;
  const result2 = await new PutAdapter<User>(DocClient, UserTableProps).put(user).if($User.version, "<=", user.version).call();
  expect(result2).toEqual(false);

  // Increment the version back and attempt to write it
  user.version++;
  const result3 = await new PutAdapter<User>(DocClient, UserTableProps).put(user).if($User.version, "<=", user.version).call();
  expect(result3).toEqual(user);
});
