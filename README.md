# Create a JavaScript Action using TypeScript

This template offers an easy way to get started writing a JavaScript action with TypeScript compile time support, unit testing with Jest and using the GitHub Actions Toolkit.

## Getting Started

See the walkthrough located [here](https://github.com/actions/toolkit/blob/master/docs/typescript-action.md).

In addition to walking your through how to create an action, it also provides strategies for versioning, releasing and referencing your actions.

## Example workflow

```yml
name: "LETS DO THIS"
on:
- pull_request
    
jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
    - uses: cbrevik/test-action@v3
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
```