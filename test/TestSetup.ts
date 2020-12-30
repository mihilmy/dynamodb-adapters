import { DocumentClient } from "aws-sdk/clients/dynamodb";

export const DocClient = new DocumentClient({ endpoint: "localhost:8000", sslEnabled: false, region: "us-east-1" });
