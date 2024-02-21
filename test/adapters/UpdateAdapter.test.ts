import { uuid } from "short-uuid";

import { UpdateAdapter } from "../../src/adapters/UpdateAdapter";

import { DocClient, UsersTable } from "../TestSetup";
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

test("T3: Complex operations on items", async () => {
  const user = new User({ username: "omar" });
  // Simple case of storing a new user
  await new UpdateAdapter<User>(DocClient, UserTableProps).update(user).call();
  const result1 = await UsersTable.get(user.userId);
  expect(result1).toEqual(user);

  // Set once
  await new UpdateAdapter<User>(DocClient, UserTableProps).update({ userId: user.userId }).once("createdAt", new Date().toISOString()).call();
  const result2 = await UsersTable.get(user.userId);
  expect(result2.createdAt).toEqual(user.createdAt);

  // Append to a set
  await new UpdateAdapter<User>(DocClient, UserTableProps)
    .update({ userId: user.userId })
    .append("skills", new Set(["Java", "Typescript"]))
    .call();
  const result3 = await UsersTable.get(user.userId);
  expect([...result3.skills]).toEqual(["Java", "Typescript"]);

  // Append to a list
  await new UpdateAdapter<User>(DocClient, UserTableProps)
    .update({ userId: user.userId })
    .append("locations", [{ country: "Egypt", city: "Cairo", votes: 0, years: 0 }])
    .call();
  const result4 = await UsersTable.get(user.userId);
  expect(result4.locations[0].votes).toEqual(0);

  // Validate adding number to a nested value
  await new UpdateAdapter<User>(DocClient, UserTableProps).update({ userId: user.userId }).addNumber($User.locations[0].votes, 1).addNumber("version", 1).call();
  const result5 = await UsersTable.get(user.userId);
  expect(result5.locations[0].votes).toEqual(1);
  expect(result5.version).toEqual(2);

  // Deleting from a path
  await new UpdateAdapter<User>(DocClient, UserTableProps).update({ userId: user.userId }).delete($User.locations[0].votes).call();

  // Deleting from list
  await new UpdateAdapter<User>(DocClient, UserTableProps).update({ userId: user.userId }).delete($User.locations[0]).call();
  const result6 = await UsersTable.get(user.userId);
  expect(result6.locations).toHaveLength(0);

  // Deleting from a set
  await new UpdateAdapter<User>(DocClient, UserTableProps)
    .update({ userId: user.userId })
    .delete($User.skills, new Set(["Java"]))
    .call();
  const result7 = await UsersTable.get(user.userId);
  expect([...result7.skills]).toEqual(["Typescript"]);
});

test("T4: Testing partial path updates", async () => {
  const user = new User({ username: "omar", version: 1 });
  const connectionId = `connectionId.${uuid()}`;

  // Asserts that we are able to update a deeply nested path
  // prettier-ignore
  await new UpdateAdapter<User>(DocClient, UserTableProps)
    .update(user)
    .updatePath($User.connections[connectionId].username, "gualtiero", true)
    .call();
  const result = await UsersTable.get(user.userId);
  expect(result.connections[connectionId].username).toEqual("gualtiero");

  // Asserts that for an existing path the update works on first try
  await new UpdateAdapter<User>(DocClient, UserTableProps)
    .update({ userId: user.userId })
    .updatePath($User.connections[connectionId].skills, new Set(["Java"]), true)
    .call();
  const result2 = await UsersTable.get(user.userId);
  expect([...result2.connections[connectionId].skills]).toEqual(expect.arrayContaining(["Java"]));
});
