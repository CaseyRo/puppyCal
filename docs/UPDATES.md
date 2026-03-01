# Updating Footer

How to pull the latest footer changes and push your local improvements.

## Pulling Updates

When the footer repository has new features or bug fixes:

```bash
# Pull latest changes from footer repo
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**What happens:**
- Latest footer code is merged into your `src/components/footer/` directory
- Your site-specific config (`src/config/footer.ts`) is not affected
- You may need to resolve merge conflicts if you've modified footer locally

### After Pulling Updates

1. **Test your build:**
   ```bash
   npm run build
   ```

2. **Test dev server:**
   ```bash
   npm run dev
   ```

3. **Verify footer still works correctly**

4. **Commit the update:**
   ```bash
   git add src/components/footer/
   git commit -m "Update footer subtree to latest version"
   ```

## Handling Merge Conflicts

If you get conflicts when pulling updates:

```bash
# 1. Pull updates (may cause conflicts)
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash

# 2. If conflicts occur, resolve them:
# - Open conflicted files (usually Footer.astro)
# - Look for conflict markers: <<<<<<< HEAD
# - Resolve conflicts (keep your changes or theirs)
# - Stage resolved files

# 3. Complete the merge
git add src/components/footer/
git commit -m "Resolve footer subtree merge conflicts"
```

**Tip**: If you've made significant local changes, consider pushing them back to the footer repo first (see below).

## Pushing Changes Back

If you've improved the footer locally and want to share with other sites:

```bash
# 1. Make sure your changes are committed locally
git status  # Check for uncommitted changes
git add src/components/footer/
git commit -m "Fix footer accessibility issue"

# 2. Push changes back to footer repo
git subtree push --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main

# 3. Create a pull request in the footer repository
# (GitHub/GitLab will show the pushed commits)
```

**Important**: Only push changes that should be shared across all sites. Site-specific
customizations should stay in your config file, not in the footer component.

## Best Practices

1. **Always test after updates**: Run build and dev server
2. **Document local changes**: If you modify footer locally, document why
3. **Push back improvements**: Don't keep bug fixes local-only
4. **Use `--squash`**: Keeps history clean, reduces conflicts
5. **Review changes**: Check what changed before pulling updates

## Version Tags

The footer repo may use version tags (v1.0.0, v1.1.0, etc.). To pull a specific version:

```bash
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  v1.2.0 --squash
```

Check the footer repo's releases/tags for available versions.

## Checking Footer Version

To see what version of footer you have:

```bash
# Check git log for footer subtree commits
git log --oneline --grep="squash" | head -5

# Or check footer repo directly
git ls-remote --tags https://github.com/CaseyRo/CYB_Footer.git
```

## Automated Update Notifications

Don't want to remember to check for updates? Use the provided templates:

### GitHub Action (Recommended)

Automatically creates a PR when updates are available:

```bash
mkdir -p .github/workflows
cp src/components/footer/scripts/consumer-templates/check-subtree-updates.yml \
   .github/workflows/check-footer-updates.yml
```

Runs weekly and creates a PR (or issue if conflicts occur).

### Pre-commit Warning

Get warned during commits if the footer is stale:

```bash
cp src/components/footer/scripts/consumer-templates/check-footer-staleness.sh \
   scripts/check-footer-staleness.sh
chmod +x scripts/check-footer-staleness.sh
```

Add to your pre-commit hook:
```bash
./scripts/check-footer-staleness.sh || true
```

See `scripts/consumer-templates/README.md` for full documentation.
