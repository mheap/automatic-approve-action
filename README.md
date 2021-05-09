# Automatic Approve

Automatically approve workflow runs from first time contributors. This action is designed to be run on a schedule within your organisation.

When executing, this action:

- Loads all workflow runs with a status of `action_required` (needs approval)
- Fetches the pull request for that run and the list of modified files
- **If a filename containing `.github/workflows` has been edited, the run will not be approved**
- Approve the workflow run using the provided access token

**If you run a file as part of your workflow (e.g. `build.js`) make sure to add that file to the `dangerous_files` input to prevent automatic approval**

## Usage

```yaml
name: Automatic Approve
on:
  schedule: "*/5 * * * *"
jobs:
  automatic-approve:
    name: Automatic Approve
    runs-on: ubuntu-latest
    steps:
      - name: Automatic Approve
        uses: mheap/automatic-approve-action@v1
        with:
          token: ${{ secrets.PAT }}
          workflows: "pr.yml,lint.yml"
          dangerous_files: "build.js"
```

## Available Configuration

### Inputs

| Name              | Description                                                                                                          | Required | Default |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| `token`           | The GitHub Token to use. Must be a [personal access token](https://github.com/settings/tokens) with the `repo` scope | true     | N/A     |
| `workflows`       | The workflows to automatically approve                                                                               | true     | N/A     |
| `dangerous_files` | A comma-separated list of filenames that prevent the PR being automatically approved                                 | false    |         |
