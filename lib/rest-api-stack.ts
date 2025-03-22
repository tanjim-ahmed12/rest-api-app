import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
// import * as cognito from "aws-cdk-lib/aws-cognito";
// import * as iam from "aws-cdk-lib/aws-iam";

// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies, movieCasts, movieReview} from "../seed/movies";
import * as iam from "aws-cdk-lib/aws-iam";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });
    const movieCastsTable = new dynamodb.Table(this, "MovieCastTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "actorName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieCast",
    });

    movieCastsTable.addLocalSecondaryIndex({
      indexName: "roleIx",
      sortKey: { name: "roleName", type: dynamodb.AttributeType.STRING },
    });

    const reviewsTable = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "MovieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews",
    });

    // // Cognito User pool
    // const userPool = new cognito.UserPool(this, "MovieReviewUserPool", {
    //   userPoolName: "MovieReviewUserPool",
    //   selfSignUpEnabled: true,
    //   signInAliases: { email: true },
    //   autoVerify: { email: true },
    // });

    // const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
    //   userPool,
    // });

    // const authorizer = new apig.CognitoUserPoolsAuthorizer(this, "APIAuthorizer", {
    //   cognitoUserPools: [userPool],

    // });
    // Functions 
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          CAST_TABLE_NAME: movieCastsTable.tableName,
          REGION: "eu-west-1",
        },
      }
      );
      
      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: `${__dirname}/../lambdas/getAllMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-west-1",
          },
        }
        );



        const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_22_X,
          entry: `${__dirname}/../lambdas/addMovie.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-west-1",
          },
        });

        // Delete movie function
        const deleteMovieFn = new lambdanode.NodejsFunction(this, "DeleteMovieFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: `${__dirname}/../lambdas/deleteMovie.ts`, // Ensure this file exists
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-west-1",
          },
        });

        // Movie cast function
    const getMovieCastMembersFn = new lambdanode.NodejsFunction(
      this,
      "GetCastMemberFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: `${__dirname}/../lambdas/getMovieCastMember.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: movieCastsTable.tableName,
          REGION: "eu-west-1",
        },
      }
    );

    // Get Reviews Function
    const getMovieReviewsFn = new lambdanode.NodejsFunction(this, "GetMovieReviewsFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: reviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Add Review Function
    const addReviewfn= new lambdanode.NodejsFunction(this, "AddMovieReviewsfn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: reviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Update Review Function

    const updateReviewFn = new lambdanode.NodejsFunction(this, "UpdateMovieReviewFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateReview.ts`, 
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: reviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Translate Review Function
    const translateReviewFn = new lambdanode.NodejsFunction(this, "TranslateReviewFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/translateReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: reviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });
       
        new custom.AwsCustomResource(this, "moviesddbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem",
            parameters: {
              RequestItems: {
                [moviesTable.tableName]: generateBatch(movies),
                [movieCastsTable.tableName]: generateBatch(movieCasts),
                [reviewsTable.tableName]: generateBatch(movieReview)  // Added
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [moviesTable.tableArn, movieCastsTable.tableArn, reviewsTable.tableArn],  // Includes movie cast
          }),
        });
    
        
        // Permissions 
        moviesTable.grantReadData(getMovieByIdFn);
        movieCastsTable.grantReadData(getMovieByIdFn);
        moviesTable.grantReadData(getAllMoviesFn);
        moviesTable.grantReadWriteData(newMovieFn);
        moviesTable.grantReadWriteData(deleteMovieFn);
        movieCastsTable.grantReadData(getMovieCastMembersFn);
        reviewsTable.grantReadData(getMovieReviewsFn);
        reviewsTable.grantReadWriteData(addReviewfn);
        reviewsTable.grantReadWriteData(updateReviewFn);
        reviewsTable.grantReadData(translateReviewFn);

        translateReviewFn.addToRolePolicy(
          new iam.PolicyStatement({
            actions: ["translate:TranslateText"],
            resources: ["*"],
          })
        );





    // REST API 
    const api = new apig.RestApi(this, "RestAPI", {
      description: "demo api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

//     // Create Cognito Authorizer
// const auth = new apig.CfnAuthorizer(this, "CognitoAuthorizer", {
//   restApiId: api.restApiId,
//   name: "CognitoAuth",
//   type: "COGNITO_USER_POOLS",
//   providerArns: ["arn:aws:cognito-idp:eu-west-1:043309332663:userpool/eu-west-1_s8ZEN9Oxe"],
// });


    // Movies endpoint
    const moviesEndpoint = api.root.addResource("movies");
    moviesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
    );
    // NEW
    moviesEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(newMovieFn, { proxy: true })
    );
    // Detail movie endpoint
    const specificMovieEndpoint = moviesEndpoint.addResource("{movieId}");
    specificMovieEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
    );

    // Delete movies endpoint
    specificMovieEndpoint.addMethod(
      "DELETE",
      new apig.LambdaIntegration(deleteMovieFn, { proxy: true })
    );
    const movieCastEndpoint = moviesEndpoint.addResource("cast");

    // Movie cast endpoint
    movieCastEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getMovieCastMembersFn, { proxy: true })
    );

    // Reviews endpoint
    const movieReviewsEndpoint = moviesEndpoint.addResource("reviews");
   
    // GET /movies/reviews/{movieId}
    const specificReviewEndpoint = movieReviewsEndpoint.addResource("{movieId}");
    specificReviewEndpoint.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true }));

    // Post /movies/reviews
    movieReviewsEndpoint.addMethod(
      "POST",
      new apig.LambdaIntegration(addReviewfn, { proxy: true })
    );

    // Put /movies/reviews

    const specificMovieReviewEndpoint = specificReviewEndpoint.addResource("{reviewId}");
    specificMovieReviewEndpoint.addMethod(
      "PUT",
      new apig.LambdaIntegration(updateReviewFn, { proxy: true })
    );

    const specificTranslationEndpoint = specificMovieReviewEndpoint.addResource("translation");

    specificTranslationEndpoint.addMethod("GET", new apig.LambdaIntegration(translateReviewFn, { proxy: true }));

    
    // Add movie reviews 
    // const api_new = new apig.RestApi(this, "MovieReviewAPI");

    // movieReviewsEndpoint.addMethod("POST", new apig.LambdaIntegration(addReviewfn), {
    //   authorizer,
    //   authorizationType: apig.AuthorizationType.COGNITO,
    // });

    // new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    // new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    // new cdk.CfnOutput(this, "APIEndpoint", { value: api.url });


    


    

    
      }
    }
    