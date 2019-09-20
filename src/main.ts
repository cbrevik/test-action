import * as core from '@actions/core';
import * as github from '@actions/github';
import prettier from "prettier"
import { file } from '@babel/types';

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
      owner,
      repo,
      pull_number: pull_request.number
    });

    

    var fileShas = prFilesResponse.data.map(f => ({ sha: f.sha, filename: f.filename }));

    const fileContents = await Promise.all(fileShas.map(({ filename }) => getContent(client, owner, repo, filename, pull_request.head.ref)));

    const formattedFiles = await Promise.all(fileContents.map(async ({ filename, content }) => {
      const fileInfo = await prettier.getFileInfo(filename);
      return {
        content = Buffer.from(result.data.content, 'base64').toString()
        formattedContent: prettier.format(content, { parser: fileInfo.inferredParser }),
        filename
      }
    }));

    console.log(formattedFiles);

    await client.issues.createComment({
      owner: owner,
      repo: repo,
      issue_number: pull_request.number,
      body: `These are your files, except formatted:\n ${formattedFiles.map((file) => `${file.filename}:${file.formattedContent}`).join("\n")}`
    });
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
