import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.REVIEWS_TABLE;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const movieId = event.pathParameters?.movieId;
    const reviewId = event.queryStringParameters?.reviewId;
    const reviewerEmail = event.queryStringParameters?.reviewerEmail;

    if (!movieId) {
      return { statusCode: 400, body: JSON.stringify({ message: "movieId is required" }) };
    }

    let params: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "movieId = :movieId",
      ExpressionAttributeValues: {
        ":movieId": movieId,
      },
    };

    // Add filtering if reviewId or reviewerEmail is provided
    if (reviewId) {
      params.KeyConditionExpression += " AND reviewId = :reviewId";
      params.ExpressionAttributeValues[":reviewId"] = reviewId;
    } else if (reviewerEmail) {
      params.FilterExpression = "reviewerEmail = :reviewerEmail";
      params.ExpressionAttributeValues[":reviewerEmail"] = reviewerEmail;
    }

    const result = await docClient.send(new QueryCommand(params));

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
