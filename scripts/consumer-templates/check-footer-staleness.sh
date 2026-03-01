#!/usr/bin/env bash
# Check if the footer subtree is behind upstream
# Add this to your pre-commit hook or run manually
#
# Usage: ./check-footer-staleness.sh [subtree-prefix]
# Default prefix: src/components/footer

set -e

SUBTREE_PREFIX="${1:-src/components/footer}"
FOOTER_REPO="https://github.com/CaseyRo/CYB_Footer.git"
CACHE_FILE="/tmp/.footer-upstream-check-$(echo "$PWD" | md5sum | cut -d' ' -f1)"
CACHE_TTL=86400  # 24 hours in seconds

# Colors for output
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

check_for_updates() {
    # Check if we're in a git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        return 0
    fi

    # Check if subtree directory exists
    if [ ! -d "$SUBTREE_PREFIX" ]; then
        return 0
    fi

    # Use cache if recent enough (avoid network calls on every commit)
    if [ -f "$CACHE_FILE" ]; then
        CACHE_AGE=$(($(date +%s) - $(stat -f%m "$CACHE_FILE" 2>/dev/null || stat -c%Y "$CACHE_FILE" 2>/dev/null || echo 0)))
        if [ "$CACHE_AGE" -lt "$CACHE_TTL" ]; then
            # Read cached result
            if [ "$(cat "$CACHE_FILE")" = "stale" ]; then
                echo -e "${YELLOW}⚠️  Footer subtree may have updates available${NC}"
                echo "   Run: git subtree pull --prefix=$SUBTREE_PREFIX $FOOTER_REPO main --squash"
            fi
            return 0
        fi
    fi

    # Fetch upstream (quietly, with timeout)
    if ! timeout 5 git ls-remote --refs "$FOOTER_REPO" HEAD > /tmp/.footer-upstream-ref 2>/dev/null; then
        # Network error - skip check silently
        return 0
    fi

    UPSTREAM_SHA=$(cut -f1 /tmp/.footer-upstream-ref)

    # Get the last subtree merge commit message to find the squashed commit
    LAST_SUBTREE_MSG=$(git log --oneline --grep="Squashed" -- "$SUBTREE_PREFIX" -1 2>/dev/null || echo "")

    # Simple heuristic: check if upstream SHA is mentioned in recent commits
    # If not, there might be updates
    if ! git log --oneline -50 | grep -q "${UPSTREAM_SHA:0:7}"; then
        echo "stale" > "$CACHE_FILE"
        echo -e "${YELLOW}⚠️  Footer subtree may have updates available${NC}"
        echo "   Run: git subtree pull --prefix=$SUBTREE_PREFIX $FOOTER_REPO main --squash"
    else
        echo "current" > "$CACHE_FILE"
    fi
}

# Run the check
check_for_updates
