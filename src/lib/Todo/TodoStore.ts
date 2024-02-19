import { v4 } from "uuid";
import { writable } from "svelte/store";
import { browser } from "$app/environment";

let initialValue: Array<TodoT> = [];

// load stored todo list
if (browser) {
  const todoStr = window.localStorage.getItem("todos");
  if (typeof todoStr === "string") {
    initialValue = JSON.parse(todoStr);
  }
}

export const todos = writable(initialValue);

export const addTodo = (text: TodoT["text"]) => {
  todos.update((cur) => {
    const newTodos = [...cur, { id: v4(), text, completed: false, createdAt: Date.now() }];
    return newTodos;
  });
};

export const deleteTodo = (id: TodoT["id"]) => {
  todos.update((todos) => todos.filter((todo) => todo.id !== id));
};

export const completeTodo = (id: TodoT["id"]) => {
  todos.update((todos) => {
    let index = -1;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        index = i;
        break;
      }
    }
    if (index !== -1) {
      todos[index].completed = !todos[index].completed;
    }
    return todos;
  });
};

// save todo list on change
todos.subscribe((todos) => {
  if (browser) {
    const todoStr = JSON.stringify(todos);
    window.localStorage.setItem("todos", todoStr);
    console.debug("Todos saved", todos);
  }
});

export interface TodoT {
  id: string;
  createdAt: number;
  completed: boolean;
  text: string;
}
