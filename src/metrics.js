'use strict';
const client = require('prom-client');

function createMetrics(store) {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [register],
  });

  const todosCreated = new client.Counter({
    name: 'todos_created_total',
    help: 'Total number of todos created since the app started',
    registers: [register],
  });

  new client.Gauge({
    name: 'todos_current',
    help: 'Current number of todos by status',
    labelNames: ['status'],
    registers: [register],
    collect() {
      const { active, completed } = store.counts();
      this.set({ status: 'active' }, active);
      this.set({ status: 'completed' }, completed);
    },
  });

  function middleware(req, res, next) {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
      // Use the route pattern (e.g. /api/todos/:id) to keep label cardinality low
      const route = req.route ? req.route.path : 'unmatched';
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  }

  return { register, middleware, todosCreated };
}

module.exports = { createMetrics };
