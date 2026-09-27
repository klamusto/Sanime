#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# نشر Sanime على Vercel بخطوة واحدة:  npm run deploy
#
# يقوم بـ: تسجيل الدخول → ربط المشروع → ضبط متغيرات البيئة (مع توليد مفتاح
# سري عشوائي) → النشر على الإنتاج.
# ---------------------------------------------------------------------------
set -euo pipefail

VERCEL="npx --yes vercel@latest"

say() { printf "\n\033[1m%s\033[0m\n" "$1"; }
ok()  { printf "   \033[32m✓\033[0m %s\n" "$1"; }

say "١/٤ · التحقق من حساب Vercel"
if $VERCEL whoami >/dev/null 2>&1; then
  ok "مسجّل الدخول باسم: $($VERCEL whoami 2>/dev/null)"
else
  echo "   سيُفتح المتصفح لتسجيل الدخول…"
  $VERCEL login
fi

say "٢/٤ · ربط المجلد بمشروع Vercel"
if [ -d .vercel ]; then
  ok "المشروع مربوط مسبقاً"
else
  $VERCEL link
  ok "تم الربط"
fi

say "٣/٤ · ضبط متغيرات البيئة"

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'
  fi
}

set_env() {
  local key="$1" value="$2" target
  for target in production preview development; do
    if $VERCEL env ls "$target" 2>/dev/null | grep -qE "(^|[[:space:]])${key}([[:space:]]|$)"; then
      ok "$key موجود مسبقاً ($target)"
      continue
    fi
    printf '%s' "$value" | $VERCEL env add "$key" "$target" >/dev/null 2>&1 \
      && ok "$key مضاف ($target)" \
      || echo "   ⚠ تعذّر ضبط $key في $target — أضفه يدوياً من لوحة Vercel"
  done
}

set_env STREAM_SECRET      "${STREAM_SECRET:-$(random_secret)}"
set_env ANIMETOM_API_BASE  "${ANIMETOM_API_BASE:-https://api.animetom.live/api}"
set_env UPSTREAM_SITE      "${UPSTREAM_SITE:-https://animetom.live}"
set_env STREAM_PROXY       "${STREAM_PROXY:-auto}"
set_env STREAM_PROBE       "${STREAM_PROBE:-1}"

say "٤/٤ · النشر على الإنتاج"
$VERCEL deploy --prod

cat <<'EOF'

تم! 🎉
  • إن ربطت نطاقاً خاصاً لاحقاً، أضف المتغير NEXT_PUBLIC_SITE_URL بقيمة نطاقك
    ثم أعد النشر (vercel deploy --prod).
  • للتأكد أن كل شيء سليم بعد النشر:
        https://<نطاقك>/api/health
        https://<نطاقك>/api/diagnose?slug=one-piece&ep=1100
EOF
