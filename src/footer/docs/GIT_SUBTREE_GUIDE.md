# Git Subtree Guide: Understanding and Using Git Subtree

## What is Git Subtree?

Git subtree is a way to include one git repository inside another git repository. Unlike git submodule, the code from the subtree repository becomes part of your main repository's history, making it easier to work with.

## How Git Subtree Works

### Concept

When you add a subtree:
1. The code from the subtree repository is **copied** into your repository at a specific path
2. The history is **merged** into your repository (or squashed)
3. You can work with the code as if it were always part of your repo
4. Updates can be pulled from the subtree repository
5. Changes can be pushed back to the subtree repository

### Visual Example

```
Your Repository (writings)
├── src/
│   ├── components/
│   │   └── footer/          ← Subtree code lives here
│   │       ├── Footer.astro
│   │       └── types.ts
│   └── config/
│       └── footer.ts        ← Your site-specific config
└── ... (rest of your code)

Footer Repository (CYB_Footer)
├── src/
│   ├── Footer.astro
│   └── types.ts
└── README.md
```

## Git Subtree vs Git Submodule

| Feature | Git Subtree | Git Submodule |
|---------|-------------|---------------|
| **Code location** | Inside your repo | Separate directory |
| **Clone needed?** | No | Yes (`git submodule init`) |
| **History** | Merged into your repo | Separate history |
| **Workflow** | Simpler | More complex |
| **Updates** | `git subtree pull` | `git submodule update` |
| **Local changes** | Edit directly | Edit in submodule dir |
| **Best for** | Small, frequently updated | Large, stable dependencies |

**Why subtree for footer?**
- Footer is small and frequently updated
- We want to edit it directly in consuming repos
- Simpler workflow for team members
- No need for separate clone/init steps

## Common Git Subtree Commands

### 1. Add Subtree (One-Time Setup)

```bash
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**What this does:**
- Adds footer repo as subtree at `src/components/footer/`
- Uses `main` branch from footer repo
- `--squash` merges all footer history into a single commit (cleaner)

### 2. Pull Updates (Get Latest Footer Changes)

```bash
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash
```

**What this does:**
- Pulls latest changes from footer repo
- Merges them into your repo
- `--squash` keeps history clean

**When to use:**
- Footer repo has bug fixes or new features
- You want to update footer across all sites

### 3. Push Changes Back (Send Your Changes to Footer Repo)

```bash
git subtree push --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main
```

**What this does:**
- Pushes your local footer changes back to footer repo
- Creates commits in footer repo

**When to use:**
- You fixed a bug in footer locally
- You added a feature to footer
- You want to share changes with other sites

### 4. Check Subtree Status

```bash
# See what's in the subtree
ls -la src/components/footer/

# Check git log for subtree commits
git log --oneline --grep="squash" | head -5
```

## Workflow Examples

### Scenario 1: Initial Setup

```bash
# 1. Add footer subtree to your repo
git subtree add --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash

# 2. Update imports in your code
# Edit BaseLayout.astro:
#   import Footer from '../components/footer/Footer.astro';

# 3. Test and commit
npm run build
git add .
git commit -m "Add footer subtree and update imports"
```

### Scenario 2: Update Footer (Pull Latest Changes)

```bash
# 1. Pull latest footer changes
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash

# 2. Test that everything still works
npm run build
npm run dev

# 3. Commit the update
git commit -m "Update footer subtree to latest version"
```

### Scenario 3: Fix Bug Locally, Push Back

```bash
# 1. Edit footer component locally
# Edit src/components/footer/Footer.astro

# 2. Test your changes
npm run build
npm run dev

# 3. Commit locally
git add src/components/footer/
git commit -m "Fix footer accessibility issue"

# 4. Push changes back to footer repo
git subtree push --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main

# 5. Now other sites can pull your fix!
```

## Handling Merge Conflicts

If you get merge conflicts when pulling updates:

```bash
# 1. Pull updates (may cause conflicts)
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  main --squash

# 2. If conflicts occur, resolve them:
# - Open conflicted files
# - Resolve conflicts (keep your changes or theirs)
# - Stage resolved files

# 3. Complete the merge
git add src/components/footer/
git commit -m "Resolve footer subtree merge conflicts"
```

## Best Practices

1. **Always use `--squash`**: Keeps history clean, reduces conflicts
2. **Test after updates**: Run build and dev server after pulling updates
3. **Document changes**: If you modify footer locally, document why
4. **Push back important fixes**: Don't keep bug fixes local-only
5. **Use tags/versions**: Footer repo can use tags (v1.0.0, v1.1.0) for versioning

## Troubleshooting

### Problem: "prefix already exists"
**Solution**: Remove the directory first, then add subtree:
```bash
rm -rf src/components/footer
git subtree add --prefix=src/components/footer <repo-url> main --squash
```

### Problem: Can't push changes back
**Solution**: Make sure you have write access to footer repo, and that your local changes are committed:
```bash
git status  # Check for uncommitted changes
git add src/components/footer/
git commit -m "Your changes"
git subtree push --prefix=src/components/footer <repo-url> main
```

### Problem: Subtree path wrong
**Solution**: Remove and re-add with correct path:
```bash
git rm -r src/components/footer
git commit -m "Remove incorrect subtree"
git subtree add --prefix=src/components/footer <repo-url> main --squash
```

## Advanced: Using Tags/Versions

If footer repo uses version tags:

```bash
# Pull specific version
git subtree pull --prefix=src/components/footer \
  https://github.com/CaseyRo/CYB_Footer.git \
  v1.2.0 --squash
```

## Summary

- **Subtree** = Include one repo inside another
- **Add**: `git subtree add --prefix=<path> <repo-url> <branch> --squash`
- **Update**: `git subtree pull --prefix=<path> <repo-url> <branch> --squash`
- **Push back**: `git subtree push --prefix=<path> <repo-url> <branch>`
- **Always test** after updates
- **Use `--squash`** for cleaner history
