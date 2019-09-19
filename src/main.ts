import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
  try {
    if (github.context.payload.action !== 'opened') {
      console.log('No issue or pull request was opened, skipping');
      return;
    }

    const welcomeMessage: string = core.getInput('welcome-message', {required: true});
    const repoToken: string = core.getInput('repo-token', {required: true});
    const issue: {owner: string; repo: string; number: number} = github.context.issue;

    const client: github.GitHub = new github.GitHub(repoToken);
    await client.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: welcomeMessage
    });
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

run();
