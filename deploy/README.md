# Deploying `apps/api` to a VPS (Oracle Cloud Always Free)

Alternative to Railway (see the main "Deploying" article) for a free-forever setup, or for running more than one service on the same box. `apps/web` still goes to Vercel — this only covers `apps/api`.

## 0. Provision the instance

You need an Oracle Cloud account and a domain (or subdomain) you can point at the instance's public IP.

### Account state

Signup lands you in a **30-day Free Trial** with credits, after which the account drops to Always Free resources only. Anything you provision that isn't Always-Free-eligible runs on trial credits and gets reclaimed when the trial ends — so confirm the **"Always Free eligible"** badge on the shape before creating anything.

Your **home region** is chosen at signup and cannot be changed afterwards. Always Free resources only exist in the home region.

### Create the network first — and use the wizard

The Virtual Cloud Networks page has two buttons side by side, and picking the wrong one costs you twenty minutes:

| Button               | What it does                                                                         |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Create VCN**       | The VCN shell only — **no subnets, no Internet Gateway, no route rules**             |
| **Start VCN Wizard** | VCN + public subnet + private subnet + Internet Gateway + NAT gateway + route tables |

Use **Start VCN Wizard → "Create VCN with Internet Connectivity"**.

"Create VCN" fails _silently_ — nothing errors. You discover it two screens later in the instance form, where the subnet dropdown is empty and the public-IP toggle is disabled behind `You must select a public subnet to assign a public IPv4 address`.

Creating the VCN inline from the instance form has the same failure mode: it can hand you a private subnet with no gateway. Build the network separately, first.

Wizard values:

| Field                    | Value           |
| ------------------------ | --------------- |
| VCN Name                 | `turborepo-vcn` |
| VCN IPv4 CIDR            | `10.0.0.0/16`   |
| Public subnet IPv4 CIDR  | `10.0.0.0/24`   |
| Private subnet IPv4 CIDR | `10.0.1.0/24`   |

Those are three **separate fields**. Entering all three into the VCN's CIDR list returns `10.0.0.0/16 is not a valid CIDR block` — misleading, because the block is fine. A VCN's CIDR blocks may not overlap each other, and `/16` contains both `/24`s.

### Generate the SSH key

Do this before creating the instance — pasting the public key is the only chance you get, and these images have no password login.

```bash
ssh-keygen -t ed25519 -C "oracle-turborepo-api" -f ~/.ssh/oracle_turborepo
```

Leave the passphrase **empty**: the GitHub Action in step 3 can't unlock a protected key non-interactively.

### Create the instance

| Field           | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Name            | `turborepo-api`                                         |
| Placement       | AD-1                                                    |
| Capacity type   | On-demand — preemptible is not Always Free eligible     |
| Image           | Canonical Ubuntu 24.04                                  |
| Shape           | `VM.Standard.A1.Flex`, **1 OCPU / 6 GB**                |
| Security        | Shielded instance and Confidential computing both off   |
| Primary network | Select existing → `turborepo-vcn`                       |
| Subnet          | Select existing → `Public Subnet-turborepo-vcn`         |
| Public IPv4     | Assign                                                  |
| SSH keys        | Paste `~/.ssh/oracle_turborepo.pub`                     |
| Boot volume     | Leave default (~47 GB; Always Free covers 200 GB total) |

Ask for 1 OCPU / 6 GB rather than the 4 OCPU / 24 GB the free tier permits. The API idles around 150–200 MB, and a smaller request is meaningfully more likely to find capacity. Scale up later if you need to.

Don't panic at the cost estimate. The form will quote you something like **~$2/month for the boot volume** and show it as an "Estimated total" — that's list price, and the estimator never subtracts Always Free allowances. Boot volumes count against the 200 GB of block storage Always Free includes, so a ~47 GB volume is covered and you won't be billed. (Not a scary number even if you were.) Confirm it yourself after a day in **Billing → Cost Analysis**, which shows real charges rather than estimates, and set a budget alert while you're there.

### If you get "Out of host capacity"

Expect this. On the free tier, A1 Arm capacity is a lottery rather than an edge case — in `eu-frankfurt-1` we hit it on **all three availability domains** in a row, over several attempts.

```
Out of capacity for shape VM.Standard.A1.Flex in availability domain AD-1.
```

Two console messages look like they're about capacity but aren't:

- **"You can create Ampere A1 compute instances in any availability domain."** This is about _eligibility_, not _availability_. The shape carries no AD restriction; that says nothing about whether a host is free. Allowed everywhere, available nowhere is the normal state.
- **"You can create instances using the VM.Standard.E2.1.Micro shape in the &lt;tenancy&gt;-AD-3 availability domain."** Always Free micro instances _are_ AD-restricted, and this names the one AD where they're permitted. Only relevant if you take the fallback.

Leave **Fault Domain unspecified** (Placement → Show advanced options). Unset lets Oracle try all fault domains; pinning one narrows the search and makes capacity less likely, not more.

Options, in order:

1. Retry across AD-1/2/3 — separate capacity pools, seconds apart. (Most regions have one AD; Frankfurt has three.)
2. Retry off-peak. Roughly 02:00–06:00 local is the widely-reported sweet spot: capacity frees as other tenants terminate instances. It's a community heuristic, not a guarantee.
3. Automate the retry with [`oracle-capacity-retry.sh`](./oracle-capacity-retry.sh) — see below.
4. Upgrade to Pay As You Go. PAYG is prioritised over trial accounts for A1 capacity — it improves your priority, it does not reserve capacity.

   PAYG is **effectively free for this setup, but not unconditionally free**, and the distinction matters. Always Free allowances still apply on a PAYG account, so an A1 instance inside those limits bills €0 exactly as it did on the trial. What you give up is the trial's hard spending ceiling: on the trial, overspending is impossible; on PAYG, anything outside the Always Free envelope — a larger shape, a second block volume, a load balancer — bills at list price with nothing to stop it.

   So it's free as long as you stay inside the lines, and there is no longer a wall stopping you from stepping outside them. Set a budget alert (Billing → Budgets) the moment you upgrade.

5. Fall back to `VM.Standard.E2.1.Micro` (AMD, 1 GB RAM, and in the AD named above). It runs the API fine, but 1 GB will likely OOM during `pnpm install` + `turbo build` on the box — which changes the deploy model to building in CI and copying `dist` across, or adding swap.

### Automating the capacity lottery

[`oracle-capacity-retry.sh`](./oracle-capacity-retry.sh) polls every AD on an interval and claims the first slot that frees, so nobody has to click a console at 3am. Ours ran six hours and 163 capacity misses before winning.

Setup, once:

```bash
brew install oci-cli          # or: https://docs.oracle.com/iaas/Content/API/SDKDocs/cliinstall.htm
oci setup config              # generates an API signing key; asks for user OCID, tenancy OCID, region
```

That prints a public key path — paste its contents into **Profile → User Settings → API Keys** in the console, or the CLI can't authenticate.

Then:

```bash
./deploy/oracle-capacity-retry.sh --discover   # prints your OCIDs
# paste those into deploy/oracle-retry.env (gitignored)
./deploy/oracle-capacity-retry.sh --dry-run    # resolves config, confirms no instance exists, launches nothing
./deploy/oracle-capacity-retry.sh              # the real loop
```

Run it under `nohup` (with `caffeinate -is` on macOS) so a sleeping laptop doesn't pause the loop.

Two things matter more than the polling itself:

**It must create exactly one instance.** A naive loop can produce several and blow past Always Free limits. The subtle case is a launch that succeeds on Oracle's side but returns non-zero — a timeout looks identical whether the request landed or not — so the script re-counts instances after every failure rather than trusting the exit code. It also holds a lock, writes a success marker, and checks before launching.

**Don't treat every error as fatal.** Our first version aborted on the first `RequestException: The connection to endpoint timed out`, throwing away six hours of waiting over a routine network blip. Capacity errors retry forever, transient ones back off, and only genuinely permanent failures (bad OCID, bad auth) stop the run.

`oracle-capacity-retry.test.sh` stubs the OCI CLI and asserts all of that — 19 assertions, no Oracle account needed.

## 1. One-time server setup

SSH into the box, then:

```bash
# Node system-wide via NodeSource — NOT nvm. See the note below.
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm via Corepack (bundled with Node — no separate install)
sudo corepack enable

# PM2, globally
sudo npm install -g pm2
pm2 startup   # PRINTS a command — you must run it. See below.

# Caddy
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

```

### Use a system-wide Node, not nvm

nvm is built for developer machines, where you switch versions per project. It loads from `~/.bashrc` — and Ubuntu's `~/.bashrc` returns early for non-interactive shells, which is exactly what an SSH deploy opens. So a CI deploy sees `node: command not found` even though `node -v` works perfectly when you log in by hand.

Sourcing `nvm.sh` in the deploy script isn't sufficient either: sourcing loads nvm, it doesn't select a version, so `node` still isn't on `PATH` unless a `default` alias happens to exist.

NodeSource installs to `/usr/bin/node`, on `PATH` for every shell, with nothing to source. For a box whose only job is running one service, that's the right trade.

### `pm2 startup` prints a command it does not run

This one costs you nothing until your first reboot, then costs you everything:

```bash
pm2 startup
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

That output looks like a confirmation. It's an instruction — **copy and run the printed command**, then:

```bash
pm2 save                          # writes the process list to ~/.pm2/dump.pm2
systemctl is-enabled pm2-ubuntu   # must say: enabled
```

Both steps are needed. The systemd unit resurrects whatever `pm2 save` recorded, so a unit without a saved dump starts PM2 with zero apps — a service that runs and hosts nothing.

If you installed PM2 under nvm and later moved to a system Node, re-run `pm2 startup` — the old unit bakes in an nvm path that won't resolve at boot.

**Then actually reboot and check**, rather than trusting the configuration:

```bash
sudo reboot
# wait ~60s, then from your own machine:
curl -sS https://your.domain/health
```

Verifying at your leisure beats discovering it during an unplanned restart.

### Open ports 80 and 443 — on both layers

Oracle blocks at two independent layers, and traffic dies if either is closed. This is the single most common reason a freshly-provisioned instance serves nothing.

**Layer 1 — the VCN Security List (cloud).** A wizard-created VCN allows SSH on 22 and ICMP, nothing else. Add TCP ingress for 80 and 443 from `0.0.0.0/0` in **Networking → Virtual Cloud Networks → your VCN → Security Lists → Default Security List → Add Ingress Rules**. Take care to _add_, not replace — losing the port 22 rule locks you out of your own box.

**Layer 2 — the host firewall.** Every guide (including an earlier version of this one) tells you to run `ufw allow 80/tcp` here. On Oracle's Ubuntu 24.04 image that fails outright:

```
sudo: ufw: command not found
```

`ufw` isn't installed, inactive, or misconfigured — it simply isn't there. The image ships pre-seeded `iptables` rules instead:

```
num  target   prot  source     destination
1    ACCEPT   all   0.0.0.0/0  0.0.0.0/0   state RELATED,ESTABLISHED
2    ACCEPT   icmp  0.0.0.0/0  0.0.0.0/0
3    ACCEPT   all   0.0.0.0/0  0.0.0.0/0
4    ACCEPT   tcp   0.0.0.0/0  0.0.0.0/0   state NEW tcp dpt:22
5    REJECT   all   0.0.0.0/0  0.0.0.0/0   reject-with icmp-host-prohibited
```

Rule 5 rejects everything that didn't match above it, so ports 80 and 443 never get through. The trap is that the obvious fix doesn't work either — `iptables -A INPUT` **appends after the REJECT**, creating a rule that exists, reads correctly in the output, and never matches. You have to **insert above** it:

```bash
# insert (-I) at position 5, above the REJECT — not append (-A), below it
sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT

# confirm 80 and 443 sit ABOVE the REJECT line
sudo iptables -L INPUT -n --line-numbers

# survive a reboot — without this the rules vanish on restart
sudo netfilter-persistent save
```

If `netfilter-persistent` is missing, `sudo apt install -y iptables-persistent` and answer yes when it offers to save the current rules.

Point your domain's A record at the instance's public IP **before** this step — Caddy validates over HTTP to get a certificate, so the name has to resolve first.

Copy `deploy/Caddyfile` from this repo to `/etc/caddy/Caddyfile` on the box (swap in your real domain), then:

```bash
sudo systemctl reload caddy
sudo journalctl -u caddy -n 20 --no-pager
```

On first run the log shows `creating new account because no account for configured email is known to us` alongside a `no such file or directory` error. That reads like a failure and isn't — it's Caddy registering an ACME account it hasn't created yet. Look for `certificate obtained successfully`.

### Verify the plumbing before deploying anything

Do this now, while there's no application to confuse the diagnosis:

```bash
# from your machine, not the box
curl -sI https://your.domain/ | head -1
```

**A 502 here is the correct result.** It means DNS, the VCN security list, the host firewall, the certificate and the reverse proxy are all working, and Caddy is faithfully proxying to a port where nothing is listening yet.

That distinction is worth buying deliberately. If you deploy the app first and then hit a problem, you're debugging six layers at once; get to a clean 502 and everything after it is application-level by definition.

Also confirm the redirect and certificate:

```bash
curl -sS -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://your.domain/   # expect 308
echo | openssl s_client -connect your.domain:443 -servername your.domain 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

Ports 80 and 443 both need to be open for this. Port 80 is not optional even though the API is HTTPS-only — Let's Encrypt validates over it, and Caddy serves the redirect from it.

## 2. Let the box into the repo (private repos only)

The deploy pulls the repo from the instance, so the box needs its own read-only credential. This is a _second_ key, in the opposite direction to the one you use to SSH in.

On the box:

```bash
ssh-keygen -t ed25519 -C "deploy" -f ~/.ssh/id_deploy -N ""
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/id_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
cat ~/.ssh/id_deploy.pub
```

Add that public key under **repo → Settings → Deploy keys**, leaving _Allow write access_ unchecked. Verify with `ssh -T git@github.com` — `successfully authenticated, but GitHub does not provide shell access` is the success case, despite reading like an error.

Skip this for a public repo and use the HTTPS clone URL instead.

## 3. Deploys via GitHub Actions

`.github/workflows/deploy-api.yml` clones on first run, then fetches, rebuilds and reloads under PM2. It's `workflow_dispatch` while you prove it out — a push-triggered deploy failing on its first run is hard to tell apart from a broken repo.

There is no manual first deploy and no hand-written `.env`: the workflow renders `apps/api/.env` from repository config on every run, so the box stays reproducible rather than becoming a machine only you know the state of.

**Secrets** (Settings → Secrets and variables → Actions → Secrets):

| Secret               | Value                                                      |
| -------------------- | ---------------------------------------------------------- |
| `VPS_HOST`           | the instance's public IP                                   |
| `VPS_USER`           | SSH user (`ubuntu` on Oracle's Ubuntu images, `opc` on OL) |
| `VPS_SSH_KEY`        | the **private** key, whole file including BEGIN/END lines  |
| `RESEND_API_KEY`     | from resend.com                                            |
| `RESEND_AUDIENCE_ID` | from resend.com                                            |

**Variables** (same page, Variables tab) — not secret, and staying visible makes misconfiguration easy to spot:

| Variable         | Example                              |
| ---------------- | ------------------------------------ |
| `API_PORT`       | `3001`                               |
| `ALLOWED_ORIGIN` | `https://your-app.vercel.app`        |
| `MAIL_FROM`      | `Your Name <noreply@yourdomain.com>` |
| `SITE_URL`       | `https://yourdomain.com`             |
| `SITE_NAME`      | `Your Name`                          |

`ALLOWED_ORIGIN` is the one that bites. Leave it unset and the API falls back to `localhost:3000`, the deploy still reports success, and the failure only appears later as an opaque CORS error in the browser. The workflow warns when it's missing.

Two failures worth expecting on a first run:

- `Error: missing server host` — a secret is empty. Most often the values were added as _Environment_ secrets, which a job without an `environment:` key cannot see.
- `node: command not found` — see the nvm note in step 1.

## 4. Finally, the frontend

`apps/web` still deploys to Vercel. Point it at the new API and redeploy:

```
NEXT_PUBLIC_API_URL=https://your-api-domain
```

`NEXT_PUBLIC_*` is inlined at build time, so changing the variable alone does nothing — you must redeploy. The CSP `connect-src` in `next.config.ts` derives from the same variable, so it follows automatically.

## Useful commands

```bash
pm2 logs api        # tail logs
pm2 status           # process state / restarts / memory
pm2 reload api        # zero-downtime restart
sudo journalctl -u caddy -f   # Caddy logs
```

## Redeploying + verifying (security fixes)

Two helper scripts live in this directory:

- [`redeploy-api.sh`](./redeploy-api.sh) — run on the VPS (or via the **Deploy API to VPS** GitHub Action) to pull `origin/main`, rebuild `apps/api`, and `pm2 reload`. `apps/api/.env` persists on the box, so it's untouched.
- [`verify-security.sh`](./verify-security.sh) — black-box checks the live API + web: `X-Powered-By` gone, helmet headers present, **rate limit is per-IP not a global bucket**, CORS locked, and `robots.txt` served. Exits non-zero on any failure.

```bash
# after pushing to origin/main:
ssh ubuntu@<vps> 'bash -s' < deploy/redeploy-api.sh   # or trigger the Action
bash deploy/verify-security.sh                         # expect ALL CHECKS PASSED
```

### Why the rate limiter needs `trust proxy`

The API sits behind Caddy on `localhost`. Without `app.set("trust proxy", 1)` every request's `req.ip` is `127.0.0.1`, so `@nestjs/throttler` keys the whole internet on one bucket — any visitor sending 10 req/min locks out every user. With trust-proxy on, a custom `ThrottlerBehindProxyGuard` keys on `req.ip` (the client IP Caddy appends as the rightmost `X-Forwarded-For` entry), which is spoof-resistant. The `Caddyfile` needs no change — Caddy sets `X-Forwarded-For` to the client IP by default, which is exactly what the app's `trust proxy` reads. **Verifying** per-IP limiting is the subtle part: you need two genuinely different source IPs. A second client behind the same NAT/egress (or a fetch tool that shares your machine's IP) lands in the first client's bucket and looks like a global limit even when it's working. Test from the box's own public IP against a throttled home connection, or a phone on cellular.
