const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const { inspect } = require("util");
// const { typedPath } = require("typed-path");
const docClient = new DocumentClient({ endpoint: "localhost:8000", sslEnabled: false, region: "us-east-1" });

/*
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -inMemory

aws dynamodb create-table \
    --table-name UsersCLI \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000


 */
async function main() {
  await docClient
    .update({
      TableName: "UsersCLI",
      Key: { userId: "1" },
      UpdateExpression: `SET colorsList[9] = :v0`,
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {
        ":v0": "yellow"
      }
    })
    .promise()
    .catch((err) => console.log(err.code, err.message, err));

  const results = await docClient.scan({ TableName: "UsersCLI" }).promise();
  console.log(inspect(results.Items, null, null, true));
}

main();
