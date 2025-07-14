# GitHub Actions Configuration

## Estado Actual

**Workflows limpiados** - Solo mantenemos el workflow de despliegue hasta completar todas las migraciones a Vue.

## Required Secrets

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

## Active Workflows

### Deploy to Google Cloud Run (`deploy-gcp.yml`)
- **Triggers**: Push to main/master or manual dispatch
- **Actions**:
  - Updates version with GitHub run number
  - Deploys to Google Cloud Run
  - Commits version update back to repository
  - Sends Slack notification (if configured)

**Note**: E2E tests removed temporarily - will be re-added after all app migrations are complete.

## Removed Workflows (Temporarily)

The following workflows were removed and will be recreated after Vue migrations:
- `cypress-tests.yml` - E2E tests with obsolete test files
- `cypress-tests-optimized.yml` - Optimized version with obsolete tests
- `test-local.yml` - Local testing workflow
- `test-production-manual.yml` - Manual production testing

## Future Workflow Plan

After completing migrations to Vue for all applications:

1. **Create new E2E test workflow** with updated test files
2. **Test locally with `act`** before deploying to GitHub Actions
3. **Add E2E tests back to deploy workflow** as a post-deployment step
4. **Validate all critical paths** work in production

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

## Testing Strategy

**Local Testing**: Use `npm run cypress:run` for E2E tests
**Production Validation**: Manual testing after deployment until workflows are rebuilt