# Consumer Templates

Scripts and workflows for projects that use this footer as a git subtree.

## GitHub Action: Automatic PR for Updates

`check-subtree-updates.yml` creates a PR (or issue if conflicts) when the footer has updates.

### GitHub Action Setup

1. Copy to your project:
   ```bash
   mkdir -p .github/workflows
   cp src/components/footer/scripts/consumer-templates/check-subtree-updates.yml \
      .github/workflows/check-footer-updates.yml
   ```

2. That's it! The action runs weekly (Mondays 9am UTC) and on manual trigger.

### GitHub Action Behavior

- Checks if upstream footer has new commits
- If updates exist, attempts `git subtree pull`
- On success: creates a PR with the changes
- On conflict: creates an issue with manual instructions
- Skips if a PR/issue already exists

### GitHub Action Customization

Edit the cron schedule in the workflow file:
```yaml
schedule:
  - cron: '0 9 * * 1'  # Every Monday at 9am UTC
```

## Pre-commit Hook: Staleness Warning

`check-footer-staleness.sh` warns you during commits if the footer is behind upstream.

### Pre-commit Setup

1. Copy to your project:
   ```bash
   cp src/components/footer/scripts/consumer-templates/check-footer-staleness.sh \
      scripts/check-footer-staleness.sh
   chmod +x scripts/check-footer-staleness.sh
   ```

2. Add to your pre-commit hook (`.husky/pre-commit` or similar):
   ```bash
   # Check for footer updates (non-blocking warning)
   ./scripts/check-footer-staleness.sh || true
   ```

### Pre-commit Behavior

- Checks upstream for new commits (with 24-hour cache to avoid network spam)
- Prints a warning if updates are available
- Non-blocking: commits still proceed
- Fails silently on network errors

### Pre-commit Customization

Change the subtree prefix if needed:
```bash
./scripts/check-footer-staleness.sh "path/to/footer"
```
