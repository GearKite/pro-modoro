<script lang="ts">
  import { browser } from "$app/environment";
  import { Modal, Button, P } from "flowbite-svelte";
  import {
    SettingsIcon,
    BarChart2Icon,
    PlayIcon,
    PauseIcon,
    SkipForwardIcon,
    BellIcon,
  } from "svelte-feather-icons";
  import ThemeSwitch from "$lib/ThemeSwitch/ThemeSwitch.svelte";
  import {
    preferences,
    defaultPreferenceValues,
    pomodoroSegments,
    playSoundEffect,
    median,
    Statistics,
    setAudioPlayerVolume,
    secondsToDisplayTime,
  } from ".";
  import { onDestroy, onMount } from "svelte";
  import { Fireworks } from "fireworks-js";

  let currentSegment = pomodoroSegments[0];
  let currentTimerEndTime: number;
  let currentTimerPauseRemainingTime: number;
  let currentTimerStartTime: number;
  let currentShortBreakCount = 0;
  let currentTimerOriginalLenght: number;

  let isTimerRunning = false;
  let isTimerPaused = false;

  let statistics: Statistics;

  let fireworks: Fireworks;

  // set user preferences to default values before loading from local storage
  let userPreferences = defaultPreferenceValues;

  // set the default displayed time on page load
  let display_time = "--:--";

  function set_segment(segment: (typeof pomodoroSegments)[0]) {
    currentSegment = segment;
    reset_timer();
  }

  function switch_next_segment(start: boolean = false) {
    if (isTimerRunning) {
      // add current segment to statistics
      addStatisticsCycle();
    }
    let next_segment;
    if (currentSegment === pomodoroSegments[0]) {
      // pomodoro
      if (currentShortBreakCount + 1 < userPreferences.cyclesBeforeLongBreak) {
        // -> isā pauze
        next_segment = pomodoroSegments[1];
      } else {
        // -> garā pauze
        next_segment = pomodoroSegments[2];
      }
    } else {
      currentShortBreakCount++;
      if (currentSegment === pomodoroSegments[1]) {
        // īsā pauze -> pomodoro
        next_segment = pomodoroSegments[0];
      } else {
        // garā pauze -> pomodoro
        next_segment = pomodoroSegments[0];
        currentShortBreakCount = 0;
      }
    }
    set_segment(next_segment);

    // automatically start next segment
    if (
      start &&
      ((currentSegment === pomodoroSegments[0] && userPreferences.autoStartPomodoro) ||
        (currentSegment !== pomodoroSegments[0] && userPreferences.autoStartBreaks))
    ) {
      start_timer();
    }
  }

  function reset_timer() {
    currentTimerEndTime = Date.now() / 1000 + userPreferences[currentSegment.id] * 60;
    isTimerPaused = false;
    isTimerRunning = false;
    display_time = secondsToDisplayTime(userPreferences[currentSegment.id] * 60);
  }

  function start_timer() {
    reset_timer();
    isTimerRunning = true;

    currentTimerStartTime = Date.now() / 1000;
    currentTimerOriginalLenght = userPreferences[currentSegment.id];

    continuous_timer_updates();
  }

  function pause_timer() {
    currentTimerPauseRemainingTime = currentTimerEndTime - Date.now() / 1000;
    isTimerRunning = false;
    isTimerPaused = true;
  }

  function resume_timer() {
    currentTimerEndTime = Date.now() / 1000 + currentTimerPauseRemainingTime;
    isTimerRunning = true;
    isTimerPaused = false;
    continuous_timer_updates();
  }
  function onBtnPlayPause() {
    if (isTimerPaused) {
      resume_timer();
    } else if (isTimerRunning) {
      pause_timer();
    } else {
      start_timer();
    }
  }

  function continuous_timer_updates() {
    let time_left = currentTimerEndTime! - Date.now() / 1000;

    // check if timer is started
    if (!isTimerRunning) {
      return;
    }

    // wait for the amount of time until the next second, or at least 500ms
    let wait_time = Math.max((time_left % 1) * 1000 + 100, 500);

    // update display
    display_time = secondsToDisplayTime(time_left);

    // check if timer finished, wait extra second at the end before switching segments
    if (time_left < 1) {
      pause_timer();
      showTimerFinished();
      if (userPreferences.autoSwitchSegment) {
        setTimeout(switch_next_segment, 1000, true);
      }
      if (currentSegment === pomodoroSegments[0]) {
        playSoundEffect(userPreferences.pomodoroSoundEffect);
      } else {
        playSoundEffect(userPreferences.breakSoundEffect);
      }
      // add current segment to statistics
      addStatisticsCycle();

      return;
    }
    setTimeout(continuous_timer_updates, wait_time);
  }

  function savePreferences() {
    // only save changed preferences (different from default)
    const differentPreferences = Object.fromEntries(
      Object.entries(userPreferences).filter(
        ([key]) =>
          !Object.keys(defaultPreferenceValues).includes(key) ||
          userPreferences[key] !== defaultPreferenceValues[key],
      ),
    );
    const preferencesToSave = JSON.stringify(differentPreferences);
    window.localStorage.setItem("preferences", preferencesToSave);
    console.debug("Preferences saved:", differentPreferences);
  }

  function saveStatistics() {
    const statisticsStr = JSON.stringify(statistics);
    window.localStorage.setItem("statistics", statisticsStr);
    console.debug("Statistics saved:", statistics);
  }

  function validateNumberAndSave(ref: string) {
    let n = userPreferences[ref];
    if (typeof n !== "number") {
      console.error("Input is not a number!", ref, n);
      userPreferences[ref] = defaultPreferenceValues[ref];
      return;
    }
    // update displayed time if the changed segment is selected
    if (!isTimerRunning && !isTimerPaused && ref == currentSegment.id) {
      display_time = secondsToDisplayTime(userPreferences[currentSegment.id] * 60);
    }
    // if this is the audio volume, update player
    if (ref === "audioVolume") {
      setAudioPlayerVolume(userPreferences.audioVolume);
    }
    savePreferences();
  }

  function addStatisticsCycle() {
    statistics.cycles.push({
      type: currentSegment.id,
      startTime: currentTimerStartTime,
      endTime: currentTimerEndTime,
      originalLenght: currentTimerOriginalLenght,
    });
    saveStatistics();
  }

  let showToast = false;
  function showTimerFinished() {
    showToast = true;
    setTimeout(() => {
      showToast = false;
      fireworks.stop();
    }, 5000);
    if (userPreferences.enableFireworks) {
      fireworks.start();
    }
  }

  if (browser) {
    // load user preferences
    const storedPreferencesStr = window.localStorage.getItem("preferences");
    if (typeof storedPreferencesStr === "string") {
      const storedPreferences = JSON.parse(storedPreferencesStr);
      userPreferences = { ...defaultPreferenceValues, ...storedPreferences };
      console.debug("Preferences loaded", userPreferences);
    }
    display_time = secondsToDisplayTime(userPreferences[currentSegment.id] * 60);
    setAudioPlayerVolume(userPreferences.audioVolume);

    // load statistics
    const storedStatisticsStr = window.localStorage.getItem("statistics");
    if (typeof storedStatisticsStr === "string") {
      statistics = JSON.parse(storedStatisticsStr);
      console.debug("Statistics loaded", statistics);
    } else {
      statistics = new Statistics();
      saveStatistics();
    }
  }

  onMount(() => {
    set_segment(currentSegment);

    const container = document.getElementById("fireworks");
    fireworks = new Fireworks(container!, {
      /* options */
    });
  });

  onDestroy(() => {
    // stop timer on hmr
    reset_timer();
  });

  let settingsModalOpen = false;
  let statisticsModalOpen = false;
</script>

<svelte:head>
  <title>Pro-modoro</title>
</svelte:head>

<nav class="absolute right-0 mt-4 mr-8 ml-8 inline-flex">
  <button
    class="inline-flex bg-slate-200 dark:bg-slate-900 p-2 rounded-md m-1 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700"
    on:click={() => (statisticsModalOpen = true)}
  >
    <BarChart2Icon />
    <span class="ml-1">Statistika</span>
  </button>
  <button
    class="inline-flex bg-slate-200 dark:bg-slate-900 p-2 rounded-md m-1 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700"
    on:click={() => (settingsModalOpen = true)}
  >
    <SettingsIcon />
    <span class="ml-1">Iestatījumi</span>
  </button>
  <ThemeSwitch />
</nav>

<div
  id="timer-finished-toast"
  class="absolute mt-4 mr-4 ml-4 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-900 transition-transform
    {showToast ? '' : 'hidden'}"
  role="alert"
>
  <BellIcon />
  <div class="ps-4 text-sm font-normal">Cikls beidzies!</div>
</div>

<main class="grid h-screen place-items-center pt-20 pb-20">
  <div>
    <h1 class="text-3xl font-bold">Pro-modoro</h1>
    <!-- Timer -->
    <h1 id="timer" class="text-8xl font-bold mt-8">
      {display_time}
    </h1>

    <!-- Segment buttons -->
    <div class="inline-flex rounded-md shadow-sm mt-8" role="group">
      {#each pomodoroSegments as segment, index}
        <button
          type="button"
          id="btn-{segment.id}"
          class="btn-segment px-4 py-2 text-sm font-medium text-gray-900 bg-transparent border border-gray-900 hover:bg-gray-900 hover:text-white focus:z-10 focus:ring-2 focus:ring-gray-500 focus:bg-gray-900 focus:text-white dark:border-white dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700 transition
                    {segment === currentSegment ? 'active' : ''}
                    {index === 0 ? 'rounded-s-lg' : ''}
                    {index === pomodoroSegments.length - 1 ? 'rounded-e-lg' : ''}"
          on:click={() => set_segment(segment)}
        >
          {segment.name}
        </button>
      {/each}
    </div>

    <!-- Pomodoro cycle progress bar -->
    <div class="mt-6">
      <div class="inline-flex">
        {#if userPreferences.cyclesBeforeLongBreak <= 12}
          {#each Array(userPreferences.cyclesBeforeLongBreak) as _, i}
            <div class="ml-1 mr-1">
              <input name="step-{i}" type="radio" disabled checked={i <= currentShortBreakCount} />
            </div>
          {/each}
        {:else}
          <span>{currentShortBreakCount + 1}/{userPreferences.cyclesBeforeLongBreak}</span>
        {/if}
      </div>
    </div>

    <!-- Controls -->
    <div class="mt-6">
      <button
        id="btn-start"
        class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
        on:click={() => onBtnPlayPause()}
      >
        <span
          class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
        >
          <PlayIcon class={(!isTimerRunning && !isTimerPaused) || isTimerPaused ? "" : "hidden"} />
          <PauseIcon class={isTimerRunning ? "" : "hidden"} />
        </span>
      </button>
      <button
        id="btn-skip"
        class="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
        on:click={() => switch_next_segment()}
      >
        <span
          class="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0"
        >
          <SkipForwardIcon /></span
        >
      </button>
    </div>
  </div>
</main>

<!-- Settings modal -->
<Modal title="Iestatījumi" bind:open={settingsModalOpen} size="xs" autoclose outsideclose>
  <div class="divide-y divide-solid">
    {#each preferences as section, i}
      <section class="ml-1 mr-1 items-start">
        <h3 class="text-xl text-slate-900 dark:text-white mb-4 {i > 0 ? 'mt-4' : ''}">
          {section.title}
        </h3>
        {#each section.preferences as preference, _}
          <label
            for="pref-{preference.ref}"
            class="select-none text-gray-900 dark:text-white text-left
                        {preference.type === 'boolean' ? 'cursor-pointer' : ''}"
          >
            <div class="inline-flex justify-between items-center w-full mb-2">
              <span class="text-base">{preference.meta}</span>
              {#if preference.type === "boolean"}
                <div class="relative">
                  <input
                    type="checkbox"
                    id="pref-{preference.ref}"
                    class="peer sr-only"
                    bind:checked={userPreferences[preference.ref]}
                    on:change={savePreferences}
                  />
                  <div
                    class="block h-8 rounded-md w-14 justify-center bg-slate-300 dark:bg-slate-900 peer-checked:bg-blue-600 transition-colors"
                  ></div>
                  <div
                    class="absolute w-6 h-6 transition bg-white rounded-md dark:bg-dark-4 left-1 top-1 peer-checked:translate-x-full peer-checked:bg-primary"
                  ></div>
                </div>
              {:else if preference.type === "number" && preference.range}
                <span>{userPreferences[preference.ref]}/{preference.max}</span>
                <input
                  type="range"
                  id="pref-{preference.ref}"
                  min={preference.min}
                  max={preference.max}
                  step={preference.step}
                  bind:value={userPreferences[preference.ref]}
                  on:change={() => validateNumberAndSave(preference.ref)}
                  class="rounded-md bg-slate-200 dark:bg-slate-900 w-1/2"
                  pattern="[0-9]"
                />
              {:else if preference.type === "number"}
                <input
                  type="number"
                  id="pref-{preference.ref}"
                  min={preference.min}
                  max={preference.max}
                  step={preference.step}
                  bind:value={userPreferences[preference.ref]}
                  on:change={() => validateNumberAndSave(preference.ref)}
                  class="rounded-md bg-slate-200 dark:bg-slate-900 w-1/2"
                  pattern="[0-9]"
                />
              {:else if preference.type === "sounds"}
                <select
                  id="pref-{preference.ref}"
                  class="rounded-md bg-slate-200 dark:bg-slate-900 w-1/2 cursor-pointer transition-colors hover:bg-gray-300 dark:hover:bg-gray-700"
                  bind:value={userPreferences[preference.ref]}
                  on:change={() => {
                    savePreferences();
                    playSoundEffect(userPreferences[preference.ref]);
                  }}
                >
                  {#each Object.entries(preference.options) as [name, _]}
                    <option on:click={() => playSoundEffect(name)} value={name}>{name}</option>
                  {/each}
                </select>
              {/if}
            </div>
          </label>
          <br />
        {/each}
      </section>
    {/each}
  </div>
  <div class="grid place-items-end">
    <Button color="alternative" class="w-24 transition">Aizvērt</Button>
  </div>
</Modal>

<!-- Statistics modal -->
<Modal title="Statistika" bind:open={statisticsModalOpen} size="xs" autoclose outsideclose>
  <div class="grid place-items-start text-slate-900 dark:text-white">
    {#each pomodoroSegments as segment}
      <section class="ml-1 mr-1 items-start text-left mb-3">
        <h4 class="text-md font-bold mb-1">{segment.name}</h4>
        <p>
          Izpildīts: {statistics.cycles.filter(function (el) {
            return el.type === segment.id;
          }).length} reizes
        </p>
        <p>
          Vidējais ilgums: {secondsToDisplayTime(
            median(
              statistics.cycles
                .filter(function (el) {
                  return el.type === segment.id;
                })
                .map((a) => a.endTime - a.startTime),
            ),
          )}
        </p>
      </section>
    {/each}
  </div>
  <div class="inline-flex w-full justify-between">
    <Button
      color="red"
      class="w-24 transition"
      on:click={() => {
        statistics = new Statistics();
        saveStatistics();
      }}
      >Nodzēst
    </Button>
    <Button color="alternative" class="w-24 transition">Aizvērt</Button>
  </div>
</Modal>

<div id="fireworks" class="absolute top-0 h-screen w-full -z-10" />

<style lang="postcss">
  .btn-segment.active {
    @apply font-bold text-white;
    text-shadow: 1px 1px black;
  }
  #btn-pomodoro.active {
    @apply bg-red-600 !important;
  }
  #btn-shortBreak.active {
    @apply bg-green-600 !important;
  }
  #btn-longBreak.active {
    @apply bg-blue-600 !important;
  }
</style>
