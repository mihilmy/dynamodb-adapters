import { QueryAdapter } from "../../src/adapters/QueryAdapter";

import { DocClient } from "../TestSetup";
import { Music, MusicTableProps, User, UserTableProps } from "../TestData";
import { AttributeValueType } from "../../src/types/Dynamo";

test("T1: Fetch by partition key only", async () => {
  const storedUser = await addUser({ username: "UserA" });
  const [fetchedUser] = await new QueryAdapter(DocClient, UserTableProps).query(storedUser.userId).call();

  expect(fetchedUser).toEqual(storedUser);
});

test("T2: Fetch and projection", async () => {
  const storedUser = await addUser({ username: "UserA" });
  const [fetchedUser] = await new QueryAdapter(DocClient, UserTableProps).query(storedUser.userId).select("createdAt", "username").call();

  expect(fetchedUser).toEqual({ username: storedUser.username, createdAt: storedUser.createdAt });
});

test("T3: Fetch and filter", async () => {
  const storedUser = await addUser({ username: "UserA", skills: new Set(["Java"]) });
  // prettier-ignore
  const [fetchedUser] = await new QueryAdapter(DocClient, UserTableProps)
    .query(storedUser.userId)
    .andIf("createdAt", "<=", new Date().toISOString())
    .andIf("skills", "Contains", "Java")
    .andIf("locations", "AttributeType", AttributeValueType.List)
    .select("createdAt", "username")
    .call();

  expect(fetchedUser).toEqual({ username: storedUser.username, createdAt: storedUser.createdAt });
});

test("T4: Fetching using GSI", async () => {
  await addMusic([
    { artist: "Drake", songTitle: "Hotline Bling", year: 2015, genre: "Hip-Hop", rating: 5 },
    { artist: "Kanye", songTitle: "POWER", year: 2010, genre: "Hip-Hop", rating: 5 },
    { artist: "The Beatles", songTitle: "Here comes the sun", year: 1969, genre: "Rock", rating: 5 },
    { artist: "The Beatles", songTitle: "Hey Jude", year: 1968, genre: "Rock", rating: 5 },
    { artist: "The Beatles", songTitle: "Yesterday", year: 1967, genre: "Rock", rating: 5 }
  ]);

  async function validateFetchingByHashKeyOnly() {
    const fetchedRecords = await new QueryAdapter(DocClient, MusicTableProps).queryIndex("genre-year-index", "Rock").call();
    expect(fetchedRecords.length).toBe(3);
    fetchedRecords.forEach((r) => expect(r.artist).toBe("The Beatles"));
  }

  async function validateFetchingByHashAndSortKey() {
    const fetchedRecords = await new QueryAdapter(DocClient, MusicTableProps).queryIndex("genre-year-index", "Rock").andIf("year", "<=", 1968).call();
    expect(fetchedRecords.length).toBe(2);
    fetchedRecords.forEach((r) => expect(r.artist).toBe("The Beatles"));
  }


  await validateFetchingByHashKeyOnly();
  await validateFetchingByHashAndSortKey();
});



async function addUser(userOptions: Partial<User>) {
  const userItem = new User(userOptions);
  await DocClient.put({ TableName: UserTableProps.tableName, Item: userItem });

  return userItem;
}

async function addMusic(musicOpts: Partial<Music>[] | Partial<Music>) {
  musicOpts = Array.isArray(musicOpts) ? musicOpts : [musicOpts];
  const promises = musicOpts.map(async (m) => {
    const musicItem = new Music(m);
    await DocClient.put({ TableName: MusicTableProps.tableName, Item: musicItem });

    return musicItem;
  });

  return Promise.all(promises);
}
