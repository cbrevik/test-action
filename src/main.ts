import * as core from '@actions/core';
import * as github from '@actions/github';

export async function run() {
  try {
    
    const { pull_request, action } = github.context.payload;
    
    if (!pull_request 
      || (action !== 'opened' && action !== 'edited')) {
        console.log('No pull request was opened or edited, skipping');
        return;
      }
      
    const repoToken: string = core.getInput('repo-token', {required: true});

    const client: github.GitHub = new github.GitHub(repoToken);

    const { owner, repo } = github.context.repo;

    const prFilesResponse = await client.pulls.listFiles({
      owner: owner,
      repo: repo,
      pull_number: pull_request.number
    });

    await client.issues.createComment({
      owner: owner,
      repo: repo,
      issue_number: pull_request.number,
      body: `These are the changed files: ${prFilesResponse.data.map((file) => file.filename).join(", ")}`
    });
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

function getPrNumber(): number | undefined {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

run();
