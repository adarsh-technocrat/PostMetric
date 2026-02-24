#!/bin/bash
# Remove all STRIPE_* env vars from Vercel production.
# Run from project root: ./scripts/vercel-env-rm-stripe.sh

set -e
cd "$(dirname "$0")/.."

if ! npx vercel whoami &>/dev/null; then
  echo "Error: Not logged in to Vercel. Run: npx vercel login"
  exit 1
fi

# Get STRIPE_STARTER_* and STRIPE_PRO_* var names (price IDs only, not secret keys)
keys=()
while read -r key; do
  [ -n "$key" ] && keys+=("$key")
done < <(grep -E "^STRIPE_STARTER_|^STRIPE_PRO_" .env.production | cut -d'=' -f1 | sort -u)

for key in "${keys[@]}"; do
  echo "Removing $key..."
  npx vercel env rm "$key" production --yes 2>/dev/null &
done
wait

echo "Done. Run ./scripts/vercel-env-push.sh to add fresh values."
