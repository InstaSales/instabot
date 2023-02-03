import middy from "@middy/core";
import secretsManager from "@middy/secrets-manager";
import { Context, SQSEvent } from "aws-lambda";
import { IgApiClient } from "instagram-private-api";

const detailsInfoHandler = async (
  event: SQSEvent,
  context: Context & { credentials: { username: string; password: string } }
) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(context.credentials.username);
  ig.state.proxyUrl = "";

  await ig.account.login(
    context.credentials.username || "",
    context.credentials.password || ""
  );

  console.dir(event, {
    depth: 20,
  });

  for (const record of event.Records) {
    const businessInfo = await ig.user.info(record.body);
    console.log(businessInfo);
  }
};

export const handler = middy(detailsInfoHandler).use(
  secretsManager({
    fetchData: {
      credentials: process.env.IG_CREDENTIALS_SECRET_NAME || "",
    },
    setToContext: true,
  })
);
