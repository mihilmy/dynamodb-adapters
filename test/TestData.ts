import { AttributeType } from "@aws-cdk/aws-dynamodb";
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
      //@ts-ignores
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
    this.artist = music.artist;
    this.createdAt = new Date().toISOString();

    for (const override of Object.keys(music)) {
      //@ts-ignores
      this[override] = music[override];
    }
  }
}

export const UserTableProps: TableProps<User, string> = {
  tableName: "Users",
  partitionKey: { name: "userId", type: AttributeType.STRING }
};

export const MusicTableProps: TableProps<Music, string> = {
  tableName: "Music",
  partitionKey: { name: "artist", type: AttributeType.STRING },
  sortKey: { name: "songTitle", type: AttributeType.STRING }
};

export const $User = typedPath<User>();
