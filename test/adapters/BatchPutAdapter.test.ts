import { BatchPutAdapter } from "../../src/adapters/BatchPutAdapter";

import { DocClient } from "../TestSetup";
import { User, UserTableProps, $User } from "../TestData";

test("T1: Validate simple batch operations", async () => {
  const userA = new User({ username: "a", version: 1 });
  const userB = new User({ username: "b", version: 1 });

  // Perform a simple BatchPut since these are blind writes
  const result1 = await new BatchPutAdapter<User>(DocClient, UserTableProps).put([userA, userB]).call();
  expect(result1).toHaveLength(0);

  // Perform a ParallelPut since we cant return the old values on batch puts
  const result2 = await new BatchPutAdapter<User>(DocClient, UserTableProps).put([userA, userB]).returnOldValues().call();
  expect(result2).toEqual([userA, userB]);

  // Perform a ParallelPut since we cant have conditionals on batch puts
  const result3 = await new BatchPutAdapter<User>(DocClient, UserTableProps).put([userA, userB]).if($User.version, "<=", 0).call();
  expect(result3).toEqual([false, false]);
});
