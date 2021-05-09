const core = require("@actions/core");
const github = require("@actions/github");
const { run } = require("jest-cli");

async function action() {
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;

  const octokit = github.getOctokit(core.getInput("token", { required: true }));
  const allowedWorkflows = core
    .getInput("workflows", { required: true })
    .split(",")
    .map((w) => {
      return `.github/workflows/${w}`;
    });

  const dangerousFiles = core
    .getInput("dangerous_files")
    .split(",")
    .filter((r) => r);
  dangerousFiles.push(".github/workflows");

  // Fetch runs that require action
  let { data: runs } = await octokit.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    status: "action_required",
  });

  // If there are no runs, return early
  if (runs.total_count == 0) {
    console.log("No runs found with status 'action_required'");
    return;
  }

  // Filter only to workflows that are in the allow list
  runs = runs.workflow_runs.filter((run) =>
    allowedWorkflows.includes(run.name)
  );

  if (runs.length == 0) {
    console.log(
      `No runs found for the following workflows: ${allowedWorkflows.join(
        ", "
      )}`
    );
  }

  // Remove any PRs that edit the `.github/workflows` directory
  runs = await runs.reduce(async (acc, run) => {
    // Find the pull request for the current run
    const { data: pulls } = await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${run.head_repository.owner.login}:${run.head_branch}`,
    });

    // List all the files in there
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pulls[0].number,
    });

    const matching = files.filter((f) => {
      for (let d of dangerousFiles) {
        if (f.filename.includes(d)) {
          return true;
        }
      }
    });

    // If we changed any files in that directory, return the current set and skip this run
    if (matching.length > 0) {
      console.log(`Skipped dangerous run '${run.id}'`);
      return acc;
    }

    // Otherwise add this run to the list of runs to execute
    return (await acc).concat(run);
  }, []);

  // Loop through them and approve all
  await Promise.all(
    runs.map(async (run) => {
      await octokit.request(
        "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve",
        {
          owner,
          repo,
          run_id: run.id,
        }
      );
      console.log(`Approved run '${run.id}'`);
    })
  );
}

if (require.main === module) {
  action();
}

module.exports = action;
