const request = require('supertest');
const { createApp } = require('../src/app');
const { TodoStore } = require('../src/store');

let app;
beforeEach(() => {
  app = createApp(new TodoStore());
});

test('new todos default to medium priority', async () => {
  const res = await request(app).post('/api/todos').send({ title: 'Task' });
  expect(res.body.priority).toBe('medium');
});

test('a todo can be created with high priority', async () => {
  const res = await request(app)
    .post('/api/todos')
    .send({ title: 'Urgent', priority: 'high' });
  expect(res.status).toBe(201);
  expect(res.body.priority).toBe('high');
});

test('an invalid priority is rejected', async () => {
  const res = await request(app).post('/api/todos').send({ title: 'Task', priority: 'urgent' });
  expect(res.status).toBe(400);
});

test('priority can be changed with PATCH', async () => {
  const { body } = await request(app).post('/api/todos').send({ title: 'Task' });
  const res = await request(app).patch(`/api/todos/${body.id}`).send({ priority: 'low' });
  expect(res.body.priority).toBe('low');
  const bad = await request(app).patch(`/api/todos/${body.id}`).send({ priority: 'nope' });
  expect(bad.status).toBe(400);
});