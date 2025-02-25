<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

const translateMsg = ref("");
const sentence = ref("");
const isTranslating = ref(false);
const targetLanguage = ref("en");

const languages = [
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
  { value: "fr", label: "French" },
  // Add more languages as needed
];

async function translate() {
  if (!sentence.value.trim()) {
    console.warn("Sentence is empty. Translation aborted.");
    return;
  }

  isTranslating.value = true;
  try {
    const response = await invoke("translate", {
      sentence: sentence.value,
      targetLanguage: targetLanguage.value
    });
    translateMsg.value = typeof response === "string" ? response.replace(/\n/g, "<br/>") : "";
  } catch (error) {
    console.error("Translation failed:", error);
  } finally {
    isTranslating.value = false;
  }
}
</script>

<template>
  <main>
    <form class="translate-form row" @submit.prevent="translate">
      <input id="translate-input" v-model="sentence" placeholder="Enter sentence..." />
      <select v-model="targetLanguage">
        <option v-for="lang in languages" :key="lang.value" :value="lang.value">
          {{ lang.label }}
        </option>
      </select>
      <button v-if="!isTranslating" type="submit">Translate</button>
      <span v-else>Translating...</span>
    </form>
    <div class="translate-msg" v-html="translateMsg"></div>
  </main>
</template>

<style scoped>
.translate-form {
  background-color: #ffffff;
  /* White background for the form */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(202, 215, 59, 0.1);
}

.translate-input {
  text-align: left;
}

.translate-msg {
  margin-top: 5px;
  padding-left: 20px;
  text-align: left;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(7, 222, 39, 0.1);
  line-height: 2;
  font-family: 'Helvetica Neue', Helvetica, Arial, 'PT Sans', sans-serif;
  font-size: 15px;
}

.row {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

input,
button {
  border-radius: 8px;
  padding: 0.6em 1.2em;
  font-size: 1em;
  border: 1px solid #ccc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  /* Subtle shadow for depth */
}

button {
  cursor: pointer;
  background-color: #0078d4;
  /* Fluent Design primary color */
  color: #ffffff;
  border: none;
}

button:hover {
  background-color: #005a9e;
  /* Darker shade for hover state */
}

button:active {
  background-color: #004578;
  /* Even darker shade for active state */
}

#translate-input {
  margin-right: 5px;
  flex: 1;
}
</style>