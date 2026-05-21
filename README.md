# random

## Surveys

Self-hosted scheduling surveys on Cloudflare Pages + KV. No third-party form service.

### Structure

```
surveys/MMDDYY/index.html   ← one folder per survey
functions/api/responses.js  ← shared API; responses are namespaced per survey in KV
```

### Deploy (one-time setup)

1. **Cloudflare Pages** → Connect to Git → pick this repo
   - Framework preset: None | Build command: (blank) | Build output directory: `/`
2. **KV namespace**: Workers & Pages → KV → Create namespace → name it `survey`
3. **Bind it**: Pages project → Settings → Functions → KV namespace bindings → Add
   - Variable name: `SURVEY_KV` | KV namespace: the one above
4. Redeploy once so the binding takes effect
5. **Custom domain**: Pages project → Custom domains → add `nwgreen.com`

### Adding a new survey

1. Copy `surveys/052126/` to `surveys/MMDDYY/`
2. Change `const SURVEY_ID = "052126"` to the new date slug
3. Update the title and questions as needed
4. Push — Cloudflare deploys automatically
5. Share `nwgreen.com/surveys/MMDDYY`

Each survey's responses are stored separately in KV under the key `survey:MMDDYY:responses`.
