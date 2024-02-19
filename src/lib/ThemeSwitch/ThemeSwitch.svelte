<script lang="ts">
    import { browser } from "$app/environment";

    import { MoonIcon, SunIcon } from "svelte-feather-icons";

    let darkMode = true;

    function handleSwitchDarkMode() {
        darkMode = !darkMode;

        localStorage.setItem("theme", darkMode ? "dark" : "light");

        darkMode
            ? document.documentElement.classList.add("dark")
            : document.documentElement.classList.remove("dark");
    }

    if (browser) {
        if (
            localStorage.theme === "dark" ||
            (!("theme" in localStorage) &&
                window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark");
            darkMode = true;
        } else {
            document.documentElement.classList.remove("dark");
            darkMode = false;
        }
    }
</script>

<input checked={darkMode} on:click={handleSwitchDarkMode} type="checkbox" id="theme-toggle" />
<label for="theme-toggle"
    ><SunIcon class={darkMode === false ? "hidden" : ""} />
    <MoonIcon class={darkMode === true ? "hidden" : ""} />
</label>

<style lang="postcss">
    #theme-toggle {
        @apply hidden;
    }

    #theme-toggle + label {
        @apply inline-flex bg-slate-200 dark:bg-slate-900 p-2 rounded-md cursor-pointer m-1 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700;
    }
</style>
