import * as core from '@actions/core';
import * as github from '@actions/github';
import prettier from "prettier"
import { WebhookPayload } from '@actions/github/lib/interfaces';

export async function handlePullRequest(payload: WebhookPayload)
{
  const { pull_request } = payload;

  if (!pull_request) {
    throw new Error("pull_request was not defined");
  }

  const { ref: headRef, sha: headSha }  = pull_request.head;

  const repoToken: string = core.getInput('repo-token', {required: true});

  const client: github.GitHub = new github.GitHub(repoToken);

  const { owner, repo } = github.context.repo;

  const prFilesResponse = await client.pulls.listFiles({
    owner,
    repo,
    pull_number: pull_request.number
  });

  var fileShas = prFilesResponse.data.map(f => ({ filename: f.filename }));

  const fileContents = await Promise.all(fileShas.map(({ filename }) => getContent(client, owner, repo, filename, headRef)));

  const formattedFiles = await Promise.all(fileContents.map(async ({ filename, content }) => {
    const fileInfo = await prettier.getFileInfo(filename);
    return {
      shouldFormat: prettier.check(content, { parser: fileInfo.inferredParser }),
      filename
    }
  }));

  await client.checks.create({
    owner,
    repo,
    name: "Check if needs to be formatted",
    head_sha: headSha,
    conclusion: "action_required",
    actions: [
      { label: "Fix formatting", description: "Fix formatting of file", identifier: "FORMATY_FOX" }
    ]
  })
}

export async function handleRequestedAction(payload: WebhookPayload) {
  console.log(payload.check_run);
}

export async function run() {
  try {
    
    const { eventName, payload: { action } } = github.context;
    console.log(`Action called with event '${eventName}' and action '${action}'`);

    if (eventName ===  "pull_request"
      && (action === 'opened' || action === 'synchronize')) {
      handlePullRequest(github.context.payload)
    } else if (eventName === "check_run" && action === "requested_action") {
      handleRequestedAction(github.context.payload)
    } else {
      console.log("Nothing to do..")
    }
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

async function getContent(client: github.GitHub, owner: string, repo: string, path: string, ref: string) {
  var result = await client.repos.getContents({
    owner,
    repo,
    path,
    ref
  });

  const content = Buffer.from((result as any).data.content, 'base64').toString()

  return {
    filename: path,
    content
  }
}

run();
