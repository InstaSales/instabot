import { IgApiClient } from "instagram-private-api";

void (async () => {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME || "");
  ig.state.proxyUrl = process.env.IG_PROXY || "";
  await ig.account.login(
    process.env.IG_USERNAME || "",
    process.env.IG_PASSWORD || ""
  );

  const userId = await ig.user.getIdByUsername("bridalbuyermagazine");
  const bride = await ig.user.info(userId);

  console.log(bride);
})();
