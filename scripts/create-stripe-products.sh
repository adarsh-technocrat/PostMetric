#!/bin/bash
# Creates Stripe products and prices for all Postmetric billing tiers
# Run: ./scripts/create-stripe-products.sh
# For production: ./scripts/create-stripe-products.sh --live
# With --write: appends to .env.local
# Requires: stripe login, jq

set -e
MODE=""
for arg in "$@"; do [ "$arg" = "--live" ] && MODE="--live"; done
WRITE_ENV=""
for arg in "$@"; do [ "$arg" = "--write" ] && WRITE_ENV=1; done

echo "Creating Stripe products and prices for all volume tiers${MODE:+ (live)}..."
echo ""

# Tier definitions from lib/billing/pricing-tiers.ts
# Format: volume_key|starter_monthly_cents|growth_monthly_cents
# 1K and 5K use 10K prices (handled in getPriceId)
TIERS="10K|500|1200 25K|1500|4000 50K|2500|6500 75K|3500|8500 100K|4500|9900 250K|6500|12500 500K|7900|15900 750K|8900|18900 1M|9900|19900 2M|11900|21900 5M|14900|22900 10M+|19900|24900"

STARTER_PROD=$(stripe products create --name="Postmetric Starter" $MODE | jq -r '.id')
GROWTH_PROD=$(stripe products create --name="Postmetric Growth" $MODE | jq -r '.id')

OUT=""
while read -r line; do
  [ -z "$line" ] && continue
  vol=$(echo "$line" | cut -d'|' -f1)
  starter_cents=$(echo "$line" | cut -d'|' -f2)
  growth_cents=$(echo "$line" | cut -d'|' -f3)
  starter_yearly=$((starter_cents * 10))
  growth_yearly=$((growth_cents * 10))

  echo "→ $vol tier"
  sid_m=$(stripe prices create --product="$STARTER_PROD" --currency=usd --unit-amount=$starter_cents -d "recurring[interval]=month" $MODE | jq -r '.id')
  sid_y=$(stripe prices create --product="$STARTER_PROD" --currency=usd --unit-amount=$starter_yearly -d "recurring[interval]=year" $MODE | jq -r '.id')
  gid_m=$(stripe prices create --product="$GROWTH_PROD" --currency=usd --unit-amount=$growth_cents -d "recurring[interval]=month" $MODE | jq -r '.id')
  gid_y=$(stripe prices create --product="$GROWTH_PROD" --currency=usd --unit-amount=$growth_yearly -d "recurring[interval]=year" $MODE | jq -r '.id')

  env_key=$(echo "$vol" | sed 's/+$/PLUS/')
  OUT="${OUT}STRIPE_STARTER_${env_key}_MONTHLY=$sid_m
STRIPE_STARTER_${env_key}_YEARLY=$sid_y
STRIPE_PRO_${env_key}_MONTHLY=$gid_m
STRIPE_PRO_${env_key}_YEARLY=$gid_y
"
  if [ "$vol" = "10K" ]; then
    OUT="${OUT}STRIPE_STARTER_PRICE_ID_MONTHLY=$sid_m
STRIPE_STARTER_PRICE_ID_YEARLY=$sid_y
STRIPE_PRO_PRICE_ID_MONTHLY=$gid_m
STRIPE_PRO_PRICE_ID_YEARLY=$gid_y
"
  fi
done <<< "$(echo "$TIERS" | tr ' ' '\n')"

echo ""
echo "Add to .env.local:"
echo ""
echo "$OUT"

if [ -n "$WRITE_ENV" ]; then
  ENV_FILE=".env.local"
  for arg in "$@"; do [ "$arg" = "--production" ] && ENV_FILE=".env.production"; done
  # Remove existing Stripe price vars (keeps STRIPE_SECRET_KEY, STRIPE_BILLING_WEBHOOK_SECRET)
  if [ -f "$ENV_FILE" ]; then
    grep -v "^STRIPE_STARTER_\|^STRIPE_PRO_" "$ENV_FILE" > "$ENV_FILE.tmp" 2>/dev/null || true
    mv "$ENV_FILE.tmp" "$ENV_FILE" 2>/dev/null || true
  fi
  echo "" >> "$ENV_FILE"
  echo "# Stripe Price IDs (all volume tiers) - must match STRIPE_SECRET_KEY mode (test vs live)" >> "$ENV_FILE"
  echo "$OUT" >> "$ENV_FILE"
  echo "✓ Appended to $ENV_FILE"
fi
