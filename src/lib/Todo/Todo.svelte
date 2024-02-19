<script lang="ts">
  import type { TodoT } from "./TodoStore.js";
  import { deleteTodo, completeTodo } from "./TodoStore.js";
  import { Trash2Icon } from "svelte-feather-icons";
  export let todo: TodoT;

  export let oncomplete = () => {};
</script>

<li
  class="bg-slate-200 dark:bg-slate-900 border border-transparent dark:border-slate-900 flex items-center shadow-sm rounded-md my-2 mx-2 py-1.5 px-3"
>
  <input
    name="completed"
    type="checkbox"
    checked={todo.completed}
    on:change={() => {
      completeTodo(todo.id);
      if (todo.completed) {
        oncomplete();
      }
    }}
    class="mr-2 form-checkbox h-5 w-5 rounded-md dark:bg-slate-600"
  />
  <span
    class={`flex-1 text-slate-900 dark:text-slate-100 text-wrap break-all ${todo.completed ? "line-through" : ""}`}
    >{todo.text}</span
  >
  <button
    type="button"
    class="text-sm bg-red-500 hover:bg-red-600 text-white ml-1 py-1 px-1 rounded focus:outline-none focus:shadow-outline
    {todo.completed ? '' : 'hidden'}"
    on:click={() => deleteTodo(todo.id)}><Trash2Icon size="16" /></button
  >
</li>
