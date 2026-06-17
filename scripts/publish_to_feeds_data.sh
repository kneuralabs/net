#!/usr/bin/env bash
# Publish one refreshed feed file to the UNPROTECTED `feeds-data` branch.
#
# The live intranet reads feed JSON cross-origin from raw.githubusercontent.com
# on the feeds-data branch (GitHub serves it with Access-Control-Allow-Origin: *,
# so no third-party proxy is needed). Publishing to a side branch — never main —
# lets the github-actions bot push regardless of main's branch protection, and
# avoids a Pages rebuild on every refresh.
#
# Run from a repo checkout, after the fetch script has written the file. Requires
# GITHUB_TOKEN (contents:write) and GITHUB_REPOSITORY — both provided by Actions.
#
# Usage: scripts/publish_to_feeds_data.sh <path-under-repo> <commit-message>
set -euo pipefail

file="${1:?path to publish required}"
message="${2:?commit message required}"
branch="feeds-data"

[ -s "$file" ] || { echo "::error::$file is missing or empty; refusing to publish"; exit 1; }
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"

remote="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

if git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null 2>&1; then
  git clone --depth 1 --branch "$branch" "$remote" "$work"
else
  # First run (or the branch was deleted) — start it fresh as an orphan so it
  # carries only the feed files, not the whole site history. Self-healing.
  git clone --depth 1 "$remote" "$work"
  git -C "$work" checkout --orphan "$branch"
  git -C "$work" rm -rf . >/dev/null 2>&1 || true
fi

dest="$work/$file"
mkdir -p "$(dirname "$dest")"
cp "$file" "$dest"

git -C "$work" config user.name "github-actions[bot]"
git -C "$work" config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git -C "$work" add "$file"
if git -C "$work" diff --cached --quiet; then
  echo "feeds-data: $file already current."
  exit 0
fi
git -C "$work" commit -m "$message"

# Push, rebasing if a sibling feed job advanced the branch first. The two feed
# workflows already share a concurrency group, so this retry is belt-and-braces
# against a manual push landing in between.
for attempt in 1 2 3; do
  if git -C "$work" push origin "$branch"; then
    echo "feeds-data: published $file."
    exit 0
  fi
  echo "feeds-data: push rejected (attempt $attempt) — rebasing on origin/$branch"
  git -C "$work" fetch origin "$branch"
  git -C "$work" rebase "origin/$branch" || git -C "$work" rebase --abort || true
  sleep 3
done

echo "::error::feeds-data: failed to publish $file after retries"
exit 1
