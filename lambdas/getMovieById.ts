import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const pathParameters = event?.pathParameters;
    const queryStringParameters = event?.queryStringParameters;

    const movieId = pathParameters?.movieId ? parseInt(pathParameters.movieId) : undefined;
    const includeCast = queryStringParameters?.cast === "true"; // Check if cast is requested

    if (!movieId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing or invalid movie ID" }),
      };
    }

    // Fetch movie metadata
    const movieCommandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: movieId },
      })
    );

    if (!movieCommandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Movie not found" }),
      };
    }

    let responseData = { movie: movieCommandOutput.Item };

    // Fetch cast if requested
    if (includeCast) {
      const castCommandOutput = await ddbDocClient.send(
        new GetCommand({
          TableName: process.env.CAST_TABLE_NAME, 
          Key: { movieId: movieId },
        })
      );

      if (castCommandOutput.Item) {
        responseData["cast"] = castCommandOutput.Item.cast;
      }
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(responseData),
    };
  } catch (error: any) {
    console.error("Error fetching movie:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
}
