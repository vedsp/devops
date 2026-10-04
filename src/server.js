'use strict';
const { createApp } = require('./app');
const { TodoStore } = require('./store');

const PORT = process.env.PORT || 3000;
const store = new TodoStore(process.env.DATA_FILE || null);
const app = createApp(store);

const server = app.listen(PORT, () => {
  console.log(`Todo app listening on port ${PORT}`);
});

// Graceful shutdown so `docker stop` / Kubernetes rollouts don't drop requests
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
