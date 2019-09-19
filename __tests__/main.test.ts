const nock = require('nock');
const path = require('path');

describe('action test suite', () => {
  it('It posts a comment on an opened issue', async () => {
    const welcomeMessage = 'hello';
    const repoToken = 'token';

    process.env['INPUT_WELCOME-MESSAGE'] = welcomeMessage;
    process.env['INPUT_REPO-TOKEN'] = repoToken;
    process.env['GITHUB_REPOSITORY'] = 'foo/bar';
    process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'payload.json');
   
    nock('https://api.github.com')
      .persist()
      .get('/repos/foo/bar/pulls/10/files')
      .reply(200, [
          { filename: "README.md" },
          { filename: "index.html" },
          { filename: "amazingcode.js" }
        ]);

    nock('https://api.github.com')
      .persist()
      .post('/repos/foo/bar/issues/10/comments', "{\"body\":\"These are the changed files: README.md, index.html, amazingcode.js\"}")
      .reply(200);

    const main = require('../src/main');

    await main.run();
  });
});