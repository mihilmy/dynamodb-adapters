const { CreateTableInput } = require("./lib/types/Props");

const UserTableProps = {
  tableName: "Users",
  partitionKey: { name: "userId", type: "S" }
};

const MusicTableProps = {
  tableName: "Music",
  partitionKey: { name: "atrist", type: "S" },
  sortKey: { name: "songTitle", type: "S" }
};

module.exports = {
  tables: [new CreateTableInput(UserTableProps), new CreateTableInput(MusicTableProps)]
};
