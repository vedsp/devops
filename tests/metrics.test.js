'use strict';
const request = require('supertest');
const { createApp } = require('../src/app');
const { TodoStore } = require('../src/store');

test('completing a todo counts once in todos_completed_total', async () => {
  const app = createApp(new TodoStore());
  const { body } = await request(app).post('/api/todos').send({ title: 'Task' });
  await request(app).patch(`/api/todos/${body.id}`).send({ completed: true });
  await request(app).patch(`/api/todos/${body.id}`).send({ completed: true });
  const res = await request(app).get('/metrics');
  expect(res.text).toContain('todos_completed_total 1');
});
