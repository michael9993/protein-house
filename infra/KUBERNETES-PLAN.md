# Kubernetes for Aura Platform — Analysis & Implementation Plan

## Context

How to implement Kubernetes for the Aura Platform and what it would help with. Currently the platform has a complete Docker Compose production setup targeting a single DigitalOcean Droplet (13 containers, Nginx reverse proxy). The platform is ~90% MVP-ready and about to launch its first client (Mansour Shoes).

This plan covers: what K8s gives you, when it makes sense, the honest trade-offs, and a phased implementation if you decide to go for it.

---

## What Kubernetes Would Help With

### Problems K8s Solves That Docker Compose Doesn't

| Problem                   | Docker Compose                            | Kubernetes                                                 |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| **Zero-downtime deploys** | Containers restart = brief downtime       | Rolling updates — new pods start before old ones stop      |
| **Auto-recovery**         | `restart: always` retries on same machine | Reschedules pods to healthy nodes if a node dies           |
| **Horizontal scaling**    | Manual — change replica count, restart    | HPA auto-scales based on CPU/memory/custom metrics         |
| **Flash sale traffic**    | Fixed capacity, can't handle spikes       | Auto-scale storefront + API during traffic spikes          |
| **Multi-tenancy**         | One compose file = one deployment         | Namespaces per client, resource quotas, network policies   |
| **SSL management**        | Manual certbot + cron                     | cert-manager auto-issues and renews Let's Encrypt certs    |
| **Secret management**     | `.env` files on disk                      | K8s Secrets (encrypted at rest), or sealed-secrets for git |
| **Rollbacks**             | `git pull` + rebuild + restart            | `kubectl rollout undo` — instant, one command              |
| **Health-aware routing**  | Nginx has no awareness of app health      | Readiness probes — traffic only goes to healthy pods       |
| **Load balancing**        | Single Nginx on single machine            | DigitalOcean Load Balancer + Ingress controller            |

### What K8s Does NOT Help With

- **Won't make your code faster** — same containers, same performance
- **Won't reduce cost at small scale** — K8s cluster costs more than a single Droplet
- **Won't simplify operations** — adds significant complexity (YAML manifests, kubectl, debugging pods)
- **Won't help if you're the only developer** — overhead may not be worth it solo

---

## Honest Recommendation: When to Use What

### Launch on Docker Compose First (Now)

Your `docker-compose.prod.yml` and `nginx.conf` are production-ready. For launching Mansour Shoes:

- **Single 8-16GB Droplet** ($48-96/mo) handles the load easily
- **Brief downtime during deploys** is acceptable at launch scale
- **Manual scaling** is fine when you know your traffic patterns
- **Time to production**: days, not weeks

### Migrate to K8s Later (3-6 months post-launch)

Trigger points that signal K8s is worth the investment:

- **Second client onboarded** — need namespace isolation
- **>500 daily orders** — need auto-scaling for reliability
- **Team grows to 2+ devs** — need proper CI/CD with rollbacks
- **Flash sales or marketing spikes** — need elastic capacity
- **Uptime SLA required** — need multi-node redundancy

---

## Cost Comparison

| Setup                                              | Monthly Cost | Zero-Downtime | Auto-Recovery | Auto-Scale |
| -------------------------------------------------- | ------------ | ------------- | ------------- | ---------- |
| **Docker Compose** (8GB Droplet)                   | ~$54         | No            | No            | No         |
| **Docker Compose** (16GB Droplet)                  | ~$102        | No            | No            | No         |
| **DOKS Basic** (2 nodes + managed DB + Redis + LB) | ~$137        | Yes           | Yes           | Yes        |
| **DOKS HA** (3 nodes + HA DB + HA Redis + LB)      | ~$227        | Yes           | Full HA       | Yes        |

The jump from Docker Compose ($102) to basic DOKS ($137) is ~$35/mo — for zero-downtime deploys, auto-recovery, and auto-scaling. Worth it once you have revenue.

---

## K8s Architecture for Aura Platform

### Cluster Layout

```
DigitalOcean Managed Kubernetes (DOKS)
├── Namespace: aura-production
│   ├── Deployments (stateless, scalable)
│   │   ├── saleor-api         (2 replicas, HPA 2→6)
│   │   ├── saleor-worker      (2 replicas, HPA 2→8)
│   │   ├── saleor-scheduler   (1 replica, no scaling)
│   │   ├── storefront         (2 replicas, HPA 2→10)
│   │   ├── dashboard          (1 replica)
│   │   ├── stripe-app         (2 replicas — payment-critical)
│   │   ├── smtp-app           (1 replica)
│   │   ├── invoices-app       (1 replica)
│   │   ├── storefront-control (1 replica)
│   │   ├── newsletter-app     (1 replica)
│   │   ├── analytics-app      (1 replica)
│   │   └── bulk-manager-app   (1 replica)
│   ├── Ingress (nginx-ingress-controller)
│   │   ├── shop.yourdomain.com     → storefront:3000
│   │   ├── api.yourdomain.com      → saleor-api:8000
│   │   ├── dashboard.yourdomain.com → dashboard:80
│   │   └── apps.yourdomain.com/*   → path-based routing to apps
│   ├── ConfigMaps (non-secret env vars)
│   ├── Secrets (DB passwords, API keys, Stripe keys)
│   └── HPA (auto-scaling rules)
├── External (Managed Services)
│   ├── DigitalOcean Managed PostgreSQL
│   ├── DigitalOcean Managed Redis (Valkey)
│   ├── DigitalOcean Spaces (S3-compatible, media storage)
│   ├── DigitalOcean Load Balancer
│   └── DigitalOcean Container Registry
```

### Key Decisions

- **PostgreSQL + Redis = Managed Services** (not in K8s) — automated backups, failover, patching
- **Media files → DigitalOcean Spaces** (S3-compatible) — no need for shared PVCs
- **All apps as Deployments** (stateless) — no StatefulSets needed
- **Single Ingress resource** with 4 hosts — replaces entire `nginx.conf`
- **cert-manager** for auto SSL — replaces certbot cron

---

## Current K8s Readiness: ~55%

| Area                | Status                                      | Readiness |
| ------------------- | ------------------------------------------- | --------- |
| **Dockerfiles**     | Multi-stage, non-root, proper signals       | 95% Ready |
| **Health Checks**   | Basic liveness, no readiness/startup probes | 40% Ready |
| **K8s Manifests**   | None exist                                  | 0% Ready  |
| **Stateful Data**   | Media + DB ok, APL file-based is a blocker  | 60% Ready |
| **Resource Limits** | Defined in prod compose                     | 90% Ready |
| **Configuration**   | Environment variables (portable)            | 90% Ready |

---

## Prerequisites Before K8s (Do on Docker Compose First)

These 3 changes are required regardless of K8s and should be done now:

### 1. Switch App Persistence Layer (APL) from File to PostgreSQL

**Why**: File-based APL stores app tokens on disk. With K8s, pods are ephemeral — data is lost on restart. The Stripe app already has PostgresAPL implemented.

**Files**:

- Template: `apps/apps/stripe/src/modules/postgres/postgres-apl.ts`
- Apply to: smtp, invoices, storefront-control, newsletter, analytics, bulk-manager

### 2. Move Media Storage to S3 (DigitalOcean Spaces)

**Why**: Docker volume `saleor-media` is local disk. With K8s, multiple API pods can't share a local volume.

**How**: Set `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL` in Saleor API env vars (django-storages already supports this).

### 3. Move Newsletter Image Storage to S3

**Why**: Same as media — local storage doesn't work with multiple replicas.

**File**: `apps/apps/newsletter/src/modules/newsletter/images/image-storage.ts` — already has S3 implementation, just set `NEWSLETTER_IMAGE_STORAGE=s3`.

---

## Phased Implementation Plan

### Phase 0: Launch on Docker Compose (Now)

No K8s changes. Use existing `docker-compose.prod.yml` + `nginx.conf` on a DigitalOcean Droplet. Complete the 3 prerequisites above.

### Phase 1: Create K8s Manifests (~2 days of work)

Create `infra/k8s/` directory with:

```
infra/k8s/
├── base/
│   ├── namespace.yaml              # aura-production namespace
│   └── configmap-shared.yaml       # Non-secret shared env vars
├── core/
│   ├── saleor-api-deployment.yaml  # 2 replicas, startup/readiness/liveness probes
│   ├── saleor-api-service.yaml     # ClusterIP :8000
│   ├── saleor-worker-deployment.yaml
│   └── saleor-scheduler-deployment.yaml
├── frontend/
│   ├── storefront-deployment.yaml  # 2 replicas, HPA
│   ├── storefront-service.yaml     # ClusterIP :3000
│   ├── dashboard-deployment.yaml   # 1 replica
│   └── dashboard-service.yaml      # ClusterIP :80
├── apps/
│   ├── stripe-app-deployment.yaml  # 2 replicas (payment-critical)
│   ├── stripe-app-service.yaml
│   ├── smtp-app-deployment.yaml    # 1 replica each for remaining apps
│   ├── smtp-app-service.yaml
│   ├── invoices-app-*.yaml
│   ├── storefront-control-app-*.yaml
│   ├── newsletter-app-*.yaml
│   ├── analytics-app-*.yaml
│   └── bulk-manager-app-*.yaml
├── ingress/
│   ├── ingress.yaml                # 4 hosts, path-based app routing
│   └── cluster-issuer.yaml         # Let's Encrypt via cert-manager
├── scaling/
│   ├── saleor-api-hpa.yaml         # Scale 2→6 at 70% CPU
│   └── storefront-hpa.yaml         # Scale 2→10 at 70% CPU
└── jobs/
    └── migrate-job.yaml            # Django migration Job (pre-deploy)
```

~25 YAML files total. Resource limits and env vars translate directly from `docker-compose.prod.yml`.

### Phase 2: Create DOKS Cluster (~1 day)

```bash
# Create cluster
doctl kubernetes cluster create aura-prod \
  --region fra1 \
  --size s-4vcpu-8gb \
  --count 2

# Create container registry
doctl registry create aura

# Create managed PostgreSQL
doctl databases create aura-postgres \
  --engine pg --version 15 \
  --size db-s-2vcpu-4gb --region fra1

# Create managed Redis (Valkey)
doctl databases create aura-redis \
  --engine valkey --version 8 \
  --size db-s-1vcpu-1gb --region fra1

# Create Spaces bucket for media (S3-compatible)
# Done via DigitalOcean web console

# Install nginx-ingress-controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set crds.enabled=true
```

### Phase 3: Deploy & Cutover (~1 day)

```bash
# Push images to registry
docker build -t registry.digitalocean.com/aura/saleor-api:v1 ../saleor/
docker push registry.digitalocean.com/aura/saleor-api:v1
# Repeat for storefront, dashboard, each app...

# Create secrets (one-time)
kubectl create secret generic saleor-api-secrets \
  --namespace aura-production \
  --from-literal=SECRET_KEY=xxx \
  --from-literal=DATABASE_URL=xxx \
  --from-literal=REDIS_URL=xxx \
  # ... etc

# Apply all manifests
kubectl apply -f infra/k8s/base/
kubectl apply -f infra/k8s/core/
kubectl apply -f infra/k8s/frontend/
kubectl apply -f infra/k8s/apps/
kubectl apply -f infra/k8s/ingress/
kubectl apply -f infra/k8s/scaling/

# Run migrations
kubectl apply -f infra/k8s/jobs/migrate-job.yaml

# Verify all pods are running
kubectl get pods -n aura-production
kubectl get ingress -n aura-production

# DNS cutover: point domains to DO Load Balancer IP
# (Get LB IP from: kubectl get svc -n ingress-nginx)
```

### Phase 4: CI/CD (Post-cutover)

Add GitHub Actions workflow `.github/workflows/k8s-deploy.yml`:

```yaml
# On push to main:
# 1. Build images → push to DO Container Registry
# 2. Run migrate Job
# 3. kubectl set image deployment/saleor-api ... (rolling update)
# 4. kubectl rollout status (wait for healthy)
```

---

## Files to Create (When Ready)

| File                                              | Purpose                                            |
| ------------------------------------------------- | -------------------------------------------------- |
| `infra/k8s/base/namespace.yaml`                   | Namespace + labels                                 |
| `infra/k8s/base/configmap-shared.yaml`            | Non-secret shared config                           |
| `infra/k8s/core/saleor-api-deployment.yaml`       | API deployment with probes                         |
| `infra/k8s/core/saleor-api-service.yaml`          | API ClusterIP service                              |
| `infra/k8s/core/saleor-worker-deployment.yaml`    | Celery worker                                      |
| `infra/k8s/core/saleor-scheduler-deployment.yaml` | Celery beat                                        |
| `infra/k8s/frontend/storefront-deployment.yaml`   | Storefront with HPA                                |
| `infra/k8s/frontend/storefront-service.yaml`      | Storefront service                                 |
| `infra/k8s/frontend/dashboard-deployment.yaml`    | Dashboard SPA                                      |
| `infra/k8s/frontend/dashboard-service.yaml`       | Dashboard service                                  |
| `infra/k8s/apps/*.yaml`                           | 7 apps x 2 files (deployment + service) = 14 files |
| `infra/k8s/ingress/ingress.yaml`                  | All 4 hosts + path routing                         |
| `infra/k8s/ingress/cluster-issuer.yaml`           | Let's Encrypt issuer                               |
| `infra/k8s/scaling/saleor-api-hpa.yaml`           | API auto-scaling (2→6 pods)                        |
| `infra/k8s/scaling/storefront-hpa.yaml`           | Storefront auto-scaling (2→10 pods)                |
| `infra/k8s/jobs/migrate-job.yaml`                 | Pre-deploy migration Job                           |
| `.github/workflows/k8s-deploy.yml`                | CI/CD pipeline                                     |

Total: ~30 files

---

## Key Operations Commands

```bash
# View all pods
kubectl get pods -n aura-production

# View logs
kubectl logs -f deployment/saleor-api -n aura-production

# Scale manually
kubectl scale deployment/storefront --replicas=4 -n aura-production

# Rolling update
kubectl set image deployment/storefront storefront=registry.digitalocean.com/aura/storefront:v2 -n aura-production

# Instant rollback
kubectl rollout undo deployment/storefront -n aura-production

# Check auto-scaling
kubectl get hpa -n aura-production -w

# Run Django shell
kubectl exec -it deployment/saleor-api -n aura-production -- python manage.py shell

# Run database backup
kubectl exec deployment/saleor-api -n aura-production -- python manage.py dumpdata > backup.json
```

---

## Verification Checklist

After deployment:

1. `kubectl get pods -n aura-production` — all pods Running
2. `kubectl get ingress -n aura-production` — all hosts with IPs
3. Visit `https://shop.yourdomain.com` — storefront loads
4. Visit `https://api.yourdomain.com/graphql/` — GraphQL responds
5. Visit `https://dashboard.yourdomain.com` — dashboard loads
6. Install apps via Dashboard — apps load in iframes
7. Test rolling update: `kubectl set image deployment/storefront storefront=new-image:v2`
8. Test rollback: `kubectl rollout undo deployment/storefront`
9. Test scaling: `kubectl scale deployment/storefront --replicas=4`
10. Test HPA: load test → watch `kubectl get hpa -w`

---

_Generated: February 8, 2026_
_Status: Documentation only — implement when ready (see trigger points above)_
