<script>
  import { addTodo } from "./TodoStore.ts";
  let todo = "";
  const handleSubmit = () => {
    // console.log('Submitting...');
    if (todo === "") {
      todo = "";
      return;
    }
    addTodo(todo);
    todo = "";
  };
</script>

<form class="mb-6 mx-3" on:submit|preventDefault={handleSubmit}>
  <div class="flex flex-col text-sm mb-2">
    <label for="todo" class="font-bold text-slate-900 dark:text-slate-100 text-2xl mb-4 cursor-text"
      >Darbu saraksts:</label
    >
    <input
      type="text"
      name="todo"
      bind:value={todo}
      placeholder="Kas darāms?"
      class="w-full h-full bg-slate-200 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all text-sm px-3 py-2.5 rounded-md caret-slate-900 dark:caret-slate-100 placeholder:ml-2"
    />
  </div>
  <button
    type="submit"
    class="outline rounded-md py-2 w-full bg-blue-600 text-slate-100 outline-black outline-1 transition-all hover:bg-blue-700"
    >Pievienot</button
  >
</form>
