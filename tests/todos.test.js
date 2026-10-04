const request = require('supertest');
const { createApp } = require('../src/app');
const { TodoStore } = require('../src/store');

let app;
beforeEach(() => {
  app = createApp(new TodoStore());
});

describe('health and metrics', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /metrics exposes Prometheus metrics', async () => {
    await request(app).post('/api/todos').send({ title: 'Metric me' });
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('todos_current{status="active"} 1');
  });
});

describe('POST /api/todos', () => {
  test('creates a todo', async () => {
    const res = await request(app).post('/api/todos').send({ title: '  Buy milk  ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, title: 'Buy milk', completed: false });
  });

  test.each([
    ['missing title', {}],
    ['empty title', { title: '   ' }],
    ['non-string title', { title: 42 }],
    ['too long title', { title: 'x'.repeat(201) }],
  ])('rejects %s', async (_name, body) => {
    const res = await request(app).post('/api/todos').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('rejects malformed JSON', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/todos', () => {
  test('returns an empty list initially', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns created todos', async () => {
    await request(app).post('/api/todos').send({ title: 'One' });
    await request(app).post('/api/todos').send({ title: 'Two' });
    const res = await request(app).get('/api/todos');
    expect(res.body.map((t) => t.title)).toEqual(['One', 'Two']);
  });
});

describe('PATCH /api/todos/:id', () => {
  test('marks a todo as completed', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Task' });
    const res = await request(app).patch(`/api/todos/${todo.id}`).send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('renames a todo', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Old' });
    const res = await request(app).patch(`/api/todos/${todo.id}`).send({ title: 'New' });
    expect(res.body.title).toBe('New');
  });

  test('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/api/todos/999').send({ completed: true });
    expect(res.status).toBe(404);
  });

  test('rejects invalid values and empty updates', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Task' });
    expect((await request(app).patch(`/api/todos/${todo.id}`).send({ completed: 'yes' })).status).toBe(400);
    expect((await request(app).patch(`/api/todos/${todo.id}`).send({ title: '' })).status).toBe(400);
    expect((await request(app).patch(`/api/todos/${todo.id}`).send({})).status).toBe(400);
  });
});

describe('DELETE endpoints', () => {
  test('deletes a todo', async () => {
    const { body: todo } = await request(app).post('/api/todos').send({ title: 'Bye' });
    const res = await request(app).delete(`/api/todos/${todo.id}`);
    expect(res.status).toBe(204);
    expect((await request(app).get('/api/todos')).body).toHaveLength(0);
  });

  test('returns 404 when deleting an unknown todo', async () => {
    const res = await request(app).delete('/api/todos/123');
    expect(res.status).toBe(404);
  });

  test('clears completed todos only', async () => {
    const a = (await request(app).post('/api/todos').send({ title: 'A' })).body;
    await request(app).post('/api/todos').send({ title: 'B' });
    await request(app).patch(`/api/todos/${a.id}`).send({ completed: true });

    const res = await request(app).delete('/api/todos/completed');
    expect(res.body.removed).toBe(1);
    const left = (await request(app).get('/api/todos')).body;
    expect(left.map((t) => t.title)).toEqual(['B']);
  });
});

describe('TodoStore persistence', () => {
  test('saves to and reloads from a file', () => {
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'todo-')), 'todos.json');

    const first = new TodoStore(file);
    first.create('Persist me');

    const second = new TodoStore(file);
    expect(second.list()).toHaveLength(1);
    expect(second.create('Next').id).toBe(2);
  });
});
