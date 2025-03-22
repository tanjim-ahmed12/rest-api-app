import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";


const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

  
    const movieId = event.pathParameters?.movieId;
    const reviewId = event.pathParameters?.reviewId;

    if (!movieId || !reviewId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing path parameters" }),
      };
    }

    
    const body = event.body ? JSON.parse(event.body) : null;
    if (!body || !body.Content) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Invalid request body. 'Content' is required." }),
      };
    }

    
    const updateCommand = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        MovieId: Number(movieId),
      },
      UpdateExpression: "SET Content = :Content",
      ExpressionAttributeValues: {
        ":Content": body.Content,
      },
      ReturnValues: "UPDATED_NEW",
    });

    await ddbDocClient.send(updateCommand);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Review updated successfully" }),
    };

  } catch (error: any) {
    console.error("[ERROR]", JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
}
