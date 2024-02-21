import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { generate as uuid } from "short-uuid";
import { typedPath } from "typed-path";

import { TableProps } from "../src/types/Props";

export class User {
  userId: string;
  username: string;
  version: number;
  skills: Set<"Java" | "Typescript">;
  createdAt: string;
  locations: { country: string; city: string; votes: number; years: number }[];
  connections: Record<string, User>;

  constructor(user: Partial<User>) {
    this.userId = `user.id.${uuid()}`;
    this.version = 1;
    this.createdAt = new Date().toISOString();
    this.locations = [];

    for (const override of Object.keys(user)) {
      // @ts-expect-error object.keys returns string which can't be used as index signature
      this[override] = user[override];
    }
  }
}

export class Music {
  artist: string;
  songTitle: string;
  year: number;
  genre: string;
  rating: number;
  createdAt: string;

  constructor(music: Partial<Music>) {
    this.createdAt = new Date().toISOString();

    for (const override of Object.keys(music)) {
      // @ts-expect-error object.keys returns string which can't be used as index signature
      this[override] = music[override];
    }
  }
}

export const UserTableProps: TableProps<User, string> = {
  tableName: "Users",
  partitionKey: { name: "userId", type: AttributeType.STRING }
};

export const MusicTableProps: TableProps<Music, "genre-year-index"> = {
  tableName: "Music",
  partitionKey: { name: "artist", type: AttributeType.STRING },
  sortKey: { name: "songTitle", type: AttributeType.STRING },
  indexMap: {
    "genre-year-index": {
      indexName: "genre-year-index",
      indexType: "Global",
      partitionKey: { name: "genre", type: AttributeType.STRING },
      sortKey: { name: "year", type: AttributeType.NUMBER }
    }
  }
};

export const $User = typedPath<User>();
