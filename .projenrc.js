const { awscdk } = require("projen");

const project = new awscdk.AwsCdkTypeScriptApp({
  name: "instabot",
  description: "A simple instabot for sales",

  cdkVersion: "2.63.0",
  deps: [
    "aws-sdk",
    "@aws-sdk/client-sqs",
    "@aws-lambda-powertools/logger",
    "@aws-lambda-powertools/tracer",
    "@aws-lambda-powertools/metrics",
    "rxjs@6.6.7",
    "instagram-private-api",
    "@middy/core",
    "@middy/event-normalizer",
    "@middy/dynamodb",
    "@middy/secrets-manager",
  ],
  devDeps: [
    "@types/aws-lambda",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-secrets-manager",
    "@aws-sdk/util-dynamodb",
  ],

  release: true,
  defaultReleaseBranch: "main",

  prettier: true,

  autoMerge: true,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ["dependabot[bot]", "edelwud"],
  },

  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
  },
});

project.synth();
