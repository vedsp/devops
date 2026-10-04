'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Tiny todo store. Lives in memory; if a file path is given it is
 * also persisted as JSON so data survives container restarts (via a volume).
 */
class TodoStore {
  constructor(filePath = null) {
    this.filePath = filePath;
    this.todos = [];
    this.nextId = 1;
    if (filePath) this._load();
  }

  _load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);
      this.todos = Array.isArray(data.todos) ? data.todos : [];
      this.nextId = data.nextId || this.todos.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    } catch (err) {
      if (err.code !== 'ENOENT') console.error('Could not read data file:', err.message);
    }
  }

  _save() {
    if (!this.filePath) return;
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify({ todos: this.todos, nextId: this.nextId }));
    } catch (err) {
      console.error('Could not write data file:', err.message);
    }
  }

  list() {
    return this.todos;
  }

  get(id) {
    return this.todos.find((t) => t.id === id) || null;
  }

  create(title) {
    const todo = { id: this.nextId++, title, completed: false, createdAt: new Date().toISOString() };
    this.todos.push(todo);
    this._save();
    return todo;
  }

  update(id, changes) {
    const todo = this.get(id);
    if (!todo) return null;
    if (changes.title !== undefined) todo.title = changes.title;
    if (changes.completed !== undefined) todo.completed = changes.completed;
    this._save();
    return todo;
  }

  remove(id) {
    const before = this.todos.length;
    this.todos = this.todos.filter((t) => t.id !== id);
    const removed = this.todos.length !== before;
    if (removed) this._save();
    return removed;
  }

  clearCompleted() {
    const before = this.todos.length;
    this.todos = this.todos.filter((t) => !t.completed);
    this._save();
    return before - this.todos.length;
  }

  counts() {
    const completed = this.todos.filter((t) => t.completed).length;
    return { active: this.todos.length - completed, completed };
  }
}

module.exports = { TodoStore };
