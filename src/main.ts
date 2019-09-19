import * as core from '@actions/core';

async function run() {
  try {
    const name = core.getInput('name');
    console.log(`Hello ${name}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
