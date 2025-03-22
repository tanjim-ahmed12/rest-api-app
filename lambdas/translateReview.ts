import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";


const ddbDocClient = createDDbDocClient();
const translateClient = createTranslateClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    
    const movieId = event.pathParameters?.movieId;
    const language = event.queryStringParameters?.language;
    const reviewId = event.pathParameters?.ReviewId;

    if (!movieId || !reviewId || !language) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing path parameters or language query." }),
      };
    }

    
    const getCommand = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        movieId: Number(movieId)
      },
    });

    const { Item } = await ddbDocClient.send(getCommand);
    if (!Item) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Review not found." }),
      };
    }

    
    const translateCommand = new TranslateTextCommand({
      SourceLanguageCode: "en",
      TargetLanguageCode: language,
      Text: Item.Content,
    });

    const { TranslatedText } = await translateClient.send(translateCommand);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        originalContent: Item.Content,
        translatedContent: TranslatedText,
      }),
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


function createTranslateClient() {
  return new TranslateClient({ region: process.env.REGION });
}
