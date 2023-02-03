import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import middy from "@middy/core";
import secretsManager from "@middy/secrets-manager";
import { Context, DynamoDBStreamEvent } from "aws-lambda";
import { IgApiClient } from "instagram-private-api";
import { of } from "rxjs";
import { concatAll } from "rxjs/operators";

const sqsClient = new SQSClient({});

const scrapperHandler = async (
  event: DynamoDBStreamEvent,
  context: Context & { credentials: { username: string; password: string } }
) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(context.credentials.username);
  ig.state.proxyUrl = "";

  await ig.account.login(
    context.credentials.username || "",
    context.credentials.password || ""
  );

  for (const record of event.Records) {
    const userId = await ig.user.getIdByUsername(
      record.dynamodb?.Keys?.instagramId.S || "amali.bridal"
    );

    const request = {
      id: userId,
      query: "brid",
    };

    const followersFeed = await ig.feed.accountFollowers(request);
    const followingFeed = await ig.feed.accountFollowing(request);
    await new Promise((resolve, reject) => {
      of(followersFeed.items$, followingFeed.items$)
        .pipe(concatAll())
        .subscribe(
          async (users) => {
            const command = new SendMessageBatchCommand({
              QueueUrl: process.env.BUSINESS_IDS_QUEUE_URL || "",
              Entries: users.map(({ pk }) => ({
                Id: pk.toString(),
                MessageBody: pk.toString(),
              })),
            });

            await sqsClient.send(command);
          },
          reject,
          () => resolve(null)
        );
    });
  }
};

export const handler = middy(scrapperHandler).use(
  secretsManager({
    fetchData: {
      credentials: process.env.IG_CREDENTIALS_SECRET_NAME || "",
    },
    setToContext: true,
  })
);
