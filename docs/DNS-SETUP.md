# seamvex.com DNS for Cloud Run

Service: `seamvex-website` · Region: `europe-west1`

## 1. Google Cloud (do first)

Create **two** domain mappings (Cloud Run → Domain mappings → Add mapping):

| Subdomain field | Maps to |
|-----------------|--------|
| *(leave blank)* | `seamvex.com` |
| `www` | `www.seamvex.com` |

Both → service `seamvex-website`.

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

## 3. seamcor.com

Repeat the same records on `seamcor.com` DNS if that domain should show the same site. Add two more domain mappings in Cloud Run for `seamcor.com` and `www.seamcor.com`.

## 4. Verify

1. Cloud Run URL `https://….run.app` loads
2. `dig www.seamvex.com CNAME` → `ghs.googlehosted.com`
3. `dig seamvex.com A` → includes `216.239.32.21` (etc.)
4. Domain mappings status → **Active** (SSL can take up to 24h)
