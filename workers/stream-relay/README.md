# وسيط البث على Cloudflare (اختياري)

هذا Worker صغير يؤدي نفس عمل `‎/api/stream‎` داخل الموقع، لكنه يعمل على شبكة
Cloudflare المجانية — فائدته الوحيدة: **نقل استهلاك بيانات الفيديو بعيداً عن
خطة الاستضافة** (Vercel تحسب كل بايت من الفيديو ضمن الـ 100GB المجانية).

لا تحتاجه إطلاقاً لكي يعمل الموقع. أضِفه فقط إن بدأت تقترب من حد النطاق الترددي.

## الخطوات

```bash
cd workers/stream-relay
npx wrangler login
npx wrangler secret put STREAM_SECRET     # الصق نفس قيمة STREAM_SECRET في Vercel
npx wrangler deploy
```

ثم في Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_STREAM_RELAY = https://sanime-stream-relay.<حسابك>.workers.dev
```

وأعد النشر. من هنا فصاعداً روابط `m3u8` والمقاطع ستمر عبر Cloudflare بدل
خادم Vercel، والتوقيع (HMAC) نفسه في الطرفين فلا شيء آخر يتغيّر.

## تحقّق سريع

```bash
curl -I "https://<الوركر>.workers.dev/api/stream?u=...&s=..."   # يجب أن يرد 200
```

إن رد `bad signature` فالمفتاح السري مختلف بين Vercel والـ Worker.
