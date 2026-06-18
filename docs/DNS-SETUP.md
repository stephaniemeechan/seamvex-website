# seamvex.com DNS for Cloud Run

Service: `seamvex-website-2` · Region: `europe-west1`

## 1. Google Cloud (do first)

Create **two** domain mappings (Cloud Run → Domain mappings → Add mapping):

| Subdomain field | Maps to |
|-----------------|--------|
| *(leave blank)* | `seamvex.com` |
| `www` | `www.seamvex.com` |

Both → service `seamvex-website-2`.

If you previously mapped domains to a deleted service, delete those mappings first, then add new ones pointing at `seamvex-website-2`.

Optional check: ⋮ → **DNS Records** on each mapping. Values below match what Google normally shows.

## 2. Squarespace → DNS Settings → Custom records

### Keep (email — do not delete)

| Type | Host | Data |
|------|------|------|
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` |
| TXT | `google._domainkey` | *(existing DKIM value)* |
| MX | `@` | `smtp.google.com` (priority 1) |

### Website — `www`

| Type | Host | Data |
|------|------|------|
| CNAME | `www` | `ghs.googlehosted.com` |

### Website — apex `@`

**Remove** single A record `199.36.158.100` if present.

**Add four A records** (same host `@`, different data):

| Type | Host | Data |
|------|------|------|
| A | `@` | `216.239.32.21` |
| A | `@` | `216.239.34.21` |
| A | `@` | `216.239.36.21` |
| A | `@` | `216.239.38.21` |

If GCP **DNS Records** shows different IPs, use those instead.

### Do not use

- Squarespace Defaults preset
- Domain Forwarding
- Website → “Update DNS records” warning button

## 3. seamcor.com (Cloudflare — website only)

Same Cloud Run service and same marketing site as `seamvex.com`. **Do not change MX, SPF, DKIM, or other email records** — only the web records below.

### 3a. Verify domain in Google Cloud (once)

Cloud Run → **Domain mappings** → **Add mapping** needs `seamcor.com` in **Select a verified domain**.

If it is missing:

1. [Google Search Console](https://search.google.com/search-console) → add property `seamcor.com` (or use Cloud Console domain verification).
2. Add the **TXT** record Google gives you in **Cloudflare → seamcor.com → DNS**.
3. Wait until verified, then continue with mappings.

### 3b. Cloud Run domain mappings

**Add mapping** twice (same as seamvex):

| Subdomain field | Maps to | Service |
|-----------------|---------|---------|
| *(leave blank)* | `seamcor.com` | `seamvex-website-2` |
| `www` | `www.seamcor.com` | `seamvex-website-2` |

On step **Update DNS records**, note the exact values Google shows (usually match the table below). Click **Done** for each.

### 3c. Cloudflare DNS (website records only)

**Cloudflare → seamcor.com → DNS → Records**

**Remove or replace** only records that send **web** traffic elsewhere (old A/CNAME on `@` or `www`, parking pages, Squarespace, etc.). **Leave all MX and email TXT records unchanged.**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `www` | `ghs.googlehosted.com` | **DNS only** (grey cloud) |
| A | `@` | `216.239.32.21` | DNS only |
| A | `@` | `216.239.34.21` | DNS only |
| A | `@` | `216.239.36.21` | DNS only |
| A | `@` | `216.239.38.21` | DNS only |

**Alternative apex:** Cloudflare allows CNAME `@` → `ghs.googlehosted.com` (flattened) instead of four A records — use one method, not both.

Use **DNS only** (grey cloud) on these rows so Google-managed SSL for Cloud Run works. Orange-cloud proxy often breaks certificate provisioning.

If GCP **DNS Records** on the mapping shows different IPs, use those instead of the table above.

### 3d. Do not use on seamcor.com

- Cloudflare **Redirect Rules** or **Page Rules** that forward `seamcor.com` to another URL (the site is served directly, not redirected).
- Changing email DNS unless you intend to move mail.

## 4. Verify

1. Cloud Run URL `https://….run.app` loads
2. `dig www.seamvex.com CNAME` → `ghs.googlehosted.com`
3. `dig seamvex.com A` → includes `216.239.32.21` (etc.)
4. `dig www.seamcor.com CNAME` → `ghs.googlehosted.com`
5. `dig seamcor.com A` → includes `216.239.32.21` (etc.)
6. All four domain mappings → **Active** (SSL can take up to 24h)
7. `https://seamcor.com`, `https://www.seamcor.com`, `https://seamvex.com`, `https://www.seamvex.com` all show the Seamcor site
