const { awscdk } = require("projen");

const project = new awscdk.AwsCdkTypeScriptApp({
  name: "instabot",
  description: "A simple instabot for sales",

  cdkVersion: "2.61.1",

  release: true,
  defaultReleaseBranch: "main",

  prettier: true,

  autoMerge: true,
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: ["dependabot[bot]", "edelwud"],
  },
});

project.synth();
