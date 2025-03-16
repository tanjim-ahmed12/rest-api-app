import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.REVIEWS_TABLE;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: "Request body is required" }) };
    }
    
    const { movieId, reviewerEmail, rating, comment } = JSON.parse(event.body);
    
    if (!movieId || !reviewerEmail || rating === undefined || !comment) {
      return { statusCode: 400, body: JSON.stringify({ message: "Missing required fields" }) };
    }

    const reviewId = uuidv4();
    const createdAt = new Date().toISOString();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        movieId,
        reviewId,
        reviewerEmail,
        rating,
        comment,
        createdAt,
      },
    };

    await docClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Review added successfully", reviewId }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: "Internal server error" }) };
  }
};
