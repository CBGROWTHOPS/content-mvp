# Connect content-admin to Git (CBGROWTHOPS/content-mvp)

Vercel does not expose an API to link an existing project to a Git repository. Use the dashboard:

## Direct link

**Connect content-admin to CBGROWTHOPS/content-mvp:**

https://vercel.com/chris-projects-ebee1a4e/content-admin/settings/git

1. Log in to Vercel (Continue with GitHub)
2. Click **Connect Git Repository**
3. Select **GitHub** → **CBGROWTHOPS/content-mvp**
4. Confirm **Root Directory** = `content-admin` (already set)
5. Deploy

After connecting, pushes to `main` will trigger automatic deploys.
