# GitHub Actions Configuration

## Required Secrets

Before using these workflows, you need to configure the following secrets in your GitHub repository:

### 1. GCP_SA_KEY (Required)
Service Account key for Google Cloud Platform deployment.

To create this:
1. Go to Google Cloud Console
2. Navigate to IAM & Admin > Service Accounts
3. Create a new service account or use existing
4. Grant the following roles:
   - Cloud Run Admin
   - Service Account User
   - Cloud Build Editor
   - Viewer
5. Create a JSON key and copy its contents
6. Add as secret in GitHub: Settings > Secrets > Actions > New repository secret

### 2. SLACK_WEBHOOK_URL (Optional)
Webhook URL for Slack notifications.

## Workflows

### 1. Deploy to Google Cloud Run (`deploy-gcp.yml`)
- Triggers on push to main/master or manual dispatch
- Updates version with GitHub run number
- Deploys to Google Cloud Run
- Commits version update back to repository

### 2. Cypress E2E Tests (`cypress-tests.yml`)
- Manual trigger only (workflow_dispatch)
- Runs tests in Chrome and Firefox
- Uploads screenshots and videos as artifacts

### 3. E2E Tests After Deploy
- Automatically runs after successful deployment
- Tests on clean test organization
- Validates all critical paths

## Version Management

The version follows the pattern: `MAJOR.MINOR.BUILD`
- MAJOR and MINOR are managed manually
- BUILD is automatically set to the GitHub Actions run number

Current version is stored in `version.json`:
```json
{
  "version": "0.0.3",
  "date": "2025-07-10"
}
```

## Manual Deployment

To trigger a manual deployment:
1. Go to Actions tab
2. Select "Deploy to Google Cloud Run"
3. Click "Run workflow"
4. Select branch and environment