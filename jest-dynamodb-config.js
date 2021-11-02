const { CreateTableInput } = require("./lib/types/Props");

const UserTableProps = {
  tableName: "Users",
  partitionKey: { name: "userId", type: "S" }
};

const MusicTableProps = {
  tableName: "Music",
  partitionKey: { name: "artist", type: "S" },
  sortKey: { name: "songTitle", type: "S" },
  indexMap: {
    "genre-year-index": {
      indexName: "genre-year-index",
      indexType: "Global",
      partitionKey: { name: "genre", type: "S" },
      sortKey: { name: "year", type: "N"}
    }
  }
};

module.exports = {
  tables: [new CreateTableInput(UserTableProps), new CreateTableInput(MusicTableProps)]
};
