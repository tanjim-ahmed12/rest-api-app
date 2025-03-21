## Serverless Movie Review API

This project provides a serverless API for managing movies and movie reviews which is built using AWS CDK, DynamoDB and Amazon Lambda. The API allows users to add, update and retrieve movie reviews dynamically.

The features integrated are as follows:
1. CRUD operations for movie reviews.
2. DynamoDB for storage of movie reviews.
3. AWS Lambda for serverless operations.
4. API Gateway used for RESTful API management.

The following section will provide the methods of installation and setup to run the project.

Prerequisites:
1. Node.js
2. AWS CLI
3. AWS CDK
4. AWS Account with IAM permissions for lambda, DynamoDB.

### Terminal commands:

1. To clone the project: 
 * $ git clone https://github.com/tanjim-ahmed12/rest-api-app.git
 * $ cd rest-api-app

2. To install dependencies: 
  * $ npm install -g aws-cdk@2.176.0

3. To find the 12 digit AWS account number:
  * $  aws sts get-caller-identity --query "Account" --output text

4. Set Up AWS CDK: 
  * $ cdk bootstrap aws://YOUR-ACCOUNT-NUMBER/eu-west-1

5. Deploy to aws: 
  * $ cdk deploy

6. To remove the stack from AWS:
  * $ cdk destroy

Source: https://tutors.dev/lab/enterprisewebdev-2025-setu-deise/topic02/book-1/AWS-CDK

### API Endpoints:

1. Get a movie review using movieId (movies/reviews/{movieId})
2. Add a movie review (movies/reviews)
3. Update the movie review (movies/reviews/{movieId}/{reviewId})

