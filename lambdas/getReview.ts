import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const pathParameters = event?.pathParameters;
    const queryStringParameters = event?.queryStringParameters;

    const movieId = pathParameters?.movieId ? parseInt(pathParameters.movieId) : undefined;


    if (!movieId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing or invalid movie ID" }),
      };
    }



    const reviewCommandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { MovieId: movieId,
          
         },
      })
    );

    if (!reviewCommandOutput.Item) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ message: "Movie not found" }),
        };
      }
      

    let responseData = { movieReview: reviewCommandOutput.Item };
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(responseData),
    };
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
}
