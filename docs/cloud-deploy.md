Cloud deployment guide

Prerequisites:
- Have WeChat DevTools installed and logged in with the project account.
- Obtain cloud envID from WeChat Cloud/CloudBase console (开通云开发或云托管).
- Node.js >=16 installed (project requirement).

Prepare:
1. Run scripts\deploy-cloud.ps1 from project root to install all cloudfunction dependencies:
   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloud.ps1

2. Configure envID in project:
- Open utils/cloud.js or config.js and set the envId used by wx.cloud.init or cloud SDK. Example:
  // utils/cloud.js
  const ENV_ID = process.env.WX_CLOUD_ENV || 'your-env-id-here';
  module.exports = { ENV_ID };

Deploy options:
A) WeChat DevTools (recommended for manual deploy)
- Open the project in WeChat DevTools, go to 云开发 / 云函数, select each cloudfunction folder and 点击上传/部署.
- Verify function names in package.json or index.js match the calls in code (wx.cloud.callFunction name: ...).

B) CloudBase CLI (automation)
- Install CLI: npm i -g @cloudbase/cli
- Login: cloudbase login
- Example deploy one function:
  cloudbase functions:deploy --name myFunction --src ./cloudfunctions/myFunction --envId your-env-id
- For many functions, script a loop to deploy each directory that contains package.json.

Permissions:
- Ensure the WeChat mini program/app has enabled cloud functions and necessary service roles.
- If using CloudBase, grant function invocation and database access permissions as needed.

Post-deploy checks:
- In console, test a few functions using provided test tool.
- Run the mini program in DevTools and confirm cloud.callFunction returns success (errCode 0).

Notes:
- scripts/deploy-cloud.ps1 only installs dependencies. Deploy step is manual or via CloudBase CLI.
- Keep envId out of source code; prefer injecting via CI environment variables or local .env excluded from git.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>