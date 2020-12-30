const { CreateTableInput } = require("./lib/types/Props");

const UserTableProps = {
  tableName: "Users",
  partitionKey: { name: "userId", type: "S" },
};

module.exports = {
  tables: [new CreateTableInput(UserTableProps)],
};
