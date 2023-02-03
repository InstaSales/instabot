import { App, Duration, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  FilterCriteria,
  FilterRule,
  StartingPosition,
} from "aws-cdk-lib/aws-lambda";
import {
  DynamoEventSource,
  SqsEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { DetailsFetcherFunction } from "./services/details-fetcher-function";
import { ScrapperFunction } from "./services/scrapper-function";

export class InstabotStack extends Stack {
  businessInstagramAccountsTable = new Table(
    this,
    "BusinessInstagramAccountsTable",
    {
      stream: StreamViewType.NEW_IMAGE,
      partitionKey: {
        name: "instagramId",
        type: AttributeType.STRING,
      },
    }
  );
  businessFailureVocabularyTable = new Table(this, "BusinessVocabularyTable", {
    partitionKey: {
      name: "phrase",
      type: AttributeType.STRING,
    },
  });

  businessIdsQueue = new Queue(this, "BusinessIdsQueue", {
    fifo: false,
    visibilityTimeout: Duration.minutes(5),
  });

  igCredentials = new Secret(this, "IgCredentials", {
    secretObjectValue: {
      username: SecretValue.unsafePlainText("username"),
      password: SecretValue.unsafePlainText("password"),
    },
  });

  scrapperFunction = new ScrapperFunction(this, "ScrapperFunction", {
    timeout: Duration.minutes(5),
    environment: {
      BUSINESS_FAILURE_VOCABULARY_TABLE_NAME:
        this.businessFailureVocabularyTable.tableName,
      BUSINESS_FAILURE_VOCABULARY_TABLE_PRIMARY_KEY: "phrase",
      BUSINESS_IDS_QUEUE_URL: this.businessIdsQueue.queueUrl,
      IG_CREDENTIALS_SECRET_NAME: this.igCredentials.secretName,
    },
  });

  detailsFetcherFunction = new DetailsFetcherFunction(
    this,
    "DetailsFetcherFunction",
    {
      timeout: Duration.minutes(5),
    }
  );

  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    this.igCredentials.grantRead(this.scrapperFunction);
    this.igCredentials.grantRead(this.detailsFetcherFunction);

    this.businessIdsQueue.grantSendMessages(this.scrapperFunction);

    this.scrapperFunction.addEventSource(
      new DynamoEventSource(this.businessInstagramAccountsTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        filters: [
          FilterCriteria.filter({
            eventName: FilterRule.isEqual("INSERT"),
          }),
        ],
      })
    );

    this.detailsFetcherFunction.addEventSource(
      new SqsEventSource(this.businessIdsQueue)
    );

    this.businessFailureVocabularyTable.grantFullAccess(
      this.detailsFetcherFunction
    );
  }
}

const app = new App();

new InstabotStack(app, "instabot", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
