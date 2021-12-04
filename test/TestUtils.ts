import { UsersTable } from "./TestSetup";

export async function validateUserIsDeleted(userId: string) {
  const undefinedUser = await UsersTable.get(userId);
  expect(undefinedUser).toBeUndefined();
}
