
set -e
cd "$(dirname "$0")/.."

if ! npx vercel whoami &>/dev/null; then
  echo "Error: Not logged in to Vercel. Run: npx vercel login"
  exit 1
fi

grep -E "^STRIPE_STARTER_|^STRIPE_PRO_" .env.production | while IFS='=' read -r key value; do
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  [ -z "$key" ] && continue
  echo "Adding $key..."
  printf '%s' "$value" | npx vercel env add "$key" production --yes --force
done

echo "Done. Run 'vercel env pull .env.production' to verify."
