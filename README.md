# To-Do List App: End-to-End DevOps Pipeline

A small to-do list web app (Node.js + Express) with a complete DevOps workflow:
GitHub, GitHub Actions CI, automated tests, Docker, deployment (Docker Compose or Kubernetes), and Prometheus + Grafana monitoring.

```
Developer -> Git/GitHub -> GitHub Actions (build, test, docker build, smoke test, push to GHCR)
                                              |
                                              v
                          Docker container (todo-app :3000) <- Prometheus (:9090) <- Grafana (:3001)
```

## Project structure

```
src/            Express API, in-memory/JSON store, Prometheus metrics
public/         Frontend (HTML, CSS, JS)
tests/          Jest + Supertest tests
Dockerfile      Multi-stage, non-root image with healthcheck
docker-compose.yml   App + Prometheus + Grafana
monitoring/     Prometheus config and provisioned Grafana dashboard
k8s/            Optional Kubernetes manifests
.github/workflows/ci.yml   CI pipeline
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | /api/todos | List todos |
| POST | /api/todos | Create `{ "title": "..." }` |
| PATCH | /api/todos/:id | Update `title` and/or `completed` |
| DELETE | /api/todos/:id | Delete one |
| DELETE | /api/todos/completed | Remove all completed |
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## 1. Run locally

```bash
npm install
npm test
npm start            # http://localhost:3000
```

## 2. Docker

```bash
docker build -t todo-devops:latest .
docker run -d --name todo-app -p 3000:3000 -v todo-data:/app/data todo-devops:latest
curl http://localhost:3000/health
docker ps
```

## 3. Full stack with monitoring (recommended for the demo)

```bash
cp .env.example .env          # set your own Grafana password
docker compose up -d --build
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| Prometheus | http://localhost:9090 (Status > Targets should show `todo-app` UP) |
| Grafana | http://localhost:3001 (user `admin`, password from `.env`) |

The dashboard "To-Do App Overview" is provisioned automatically. To make the graphs move, add, complete and delete tasks in the app, or generate traffic:

```bash
for i in $(seq 1 200); do curl -s localhost:3000/api/todos > /dev/null; done
```

Custom metrics: `todos_created_total`, `todos_current{status}`, `http_request_duration_seconds` (plus default Node.js process metrics).

## 4. Kubernetes (optional, using minikube)

```bash
minikube start
eval $(minikube docker-env)
docker build -t todo-devops:latest .
kubectl apply -f k8s/
kubectl get pods
minikube service todo-app --url
```

## 5. CI pipeline (GitHub Actions)

`.github/workflows/ci.yml` runs on every push to `main`/`develop` and on pull requests to `main`:

1. **build-and-test**: `npm ci`, run tests with coverage, upload the coverage report
2. **docker**: build the image, run the container, check `/health` and `/metrics`
3. **publish** (main only): push the image to GitHub Container Registry using the built-in `GITHUB_TOKEN`. No secrets to store.

## Git workflow for the group

```bash
git init && git branch -M main
git remote add origin https://github.com/<user>/<repo>.git

git checkout -b develop
git checkout -b feature/<your-feature>     # each member works on their own branch
git add . && git commit -m "feat: describe the change"
git push -u origin feature/<your-feature>
# open a Pull Request into develop, then develop into main
```

Suggested split for a group of 3 (everyone should commit in each area over time):

- Member 1: application code and tests (`src/`, `public/`, `tests/`)
- Member 2: CI and Docker (`.github/`, `Dockerfile`, `docker-compose.yml`)
- Member 3: monitoring, Kubernetes and documentation (`monitoring/`, `k8s/`, report)

Never commit `.env` or any credentials (already in `.gitignore`).

## Screenshot checklist for the report

1. GitHub repo with commit history and branches
2. Pull request(s) merged
3. GitHub Actions run: all jobs green, plus the test log
4. Local test output with coverage
5. `docker build` and `docker ps` showing the running container
6. App running in the browser
7. Prometheus Targets page showing `todo-app` UP
8. Grafana dashboard with live data
9. (Optional) `kubectl get pods,svc`
