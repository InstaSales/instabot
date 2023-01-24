const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  name: 'instabot',
  description: 'A simple instabot for sales',

  cdkVersion: '2.61.1',

  release: true,
  defaultReleaseBranch: 'main',
  
  prettier: true,
});
project.synth();
