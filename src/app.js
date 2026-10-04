'use strict';
const express = require('express');
const path = require('path');
const { TodoStore } = require('./store');
const { createMetrics } = require('./metrics');

function validateTitle(value) {
  if (typeof value !== 'string') return { error: 'title must be a string' };
  const title = value.trim();
  if (title.length === 0) return { error: 'title cannot be empty' };
  if (title.length > 200) return { error: 'title must be 200 characters or fewer' };
  return { title };
}

function createApp(store = new TodoStore()) {
  const app = express();
  const metrics = createMetrics(store);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(metrics.middleware);

  // ---- Operational endpoints ----
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metrics.register.contentType);
    res.end(await metrics.register.metrics());
  });

  // ---- Todo API ----
  app.get('/api/todos', (req, res) => {
    res.json(store.list());
  });

  app.post('/api/todos', (req, res) => {
    const { title, error } = validateTitle(req.body && req.body.title);
    if (error) return res.status(400).json({ error });
    const todo = store.create(title);
    metrics.todosCreated.inc();
    res.status(201).json(todo);
  });

  // Must be declared before /api/todos/:id
  app.delete('/api/todos/completed', (req, res) => {
    res.json({ removed: store.clearCompleted() });
  });

  app.patch('/api/todos/:id', (req, res) => {
    const id = Number(req.params.id);
    const body = req.body || {};
    const changes = {};

    if (body.title !== undefined) {
      const { title, error } = validateTitle(body.title);
      if (error) return res.status(400).json({ error });
      changes.title = title;
    }
    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') {
        return res.status(400).json({ error: 'completed must be true or false' });
      }
      changes.completed = body.completed;
    }
    if (Object.keys(changes).length === 0) {
      return res.status(400).json({ error: 'nothing to update' });
    }

    const todo = store.update(id, changes);
    if (!todo) return res.status(404).json({ error: 'todo not found' });
    res.json(todo);
  });

  app.delete('/api/todos/:id', (req, res) => {
    const removed = store.remove(Number(req.params.id));
    if (!removed) return res.status(404).json({ error: 'todo not found' });
    res.status(204).end();
  });

  // ---- Frontend ----
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Malformed JSON and other errors
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: status === 500 ? 'internal server error' : err.message });
  });

  return app;
}

module.exports = { createApp };
