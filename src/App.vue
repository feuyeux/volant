<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ref, onUnmounted } from "vue";

const translateMsg = ref("");
const sentence = ref("");
const isTranslating = ref(false);
const sourceLanguage = ref("中文"); // default source language
const targetLanguage = ref("英语"); // default target language
const isStream = true;

const languages = [
  { value: "中文", label: "Chinese" },
  { value: "英语", label: "English" },
  { value: "德语", label: "German" },
  { value: "法语", label: "French" },
  { value: "西班牙语", label: "Spanish" },
  { value: "俄语", label: "Russian" },
  { value: "希腊语", label: "Greek" },
  { value: "阿拉伯语", label: "Arabic" },
  { value: "希伯来语", label: "Hebrew" },
  { value: "印地语", label: "Hindi" },
  { value: "韩语", label: "Korean" },
  { value: "日语", label: "Japanese" },
  { value: "泰语", label: "Thai" },
];

let unsubscribeTranslation: (() => void) | null = null;

async function translate() {
  if (!sentence.value.trim()) {
    console.warn("Sentence is empty. Translation aborted.");
    return;
  }

  isTranslating.value = true;
  try {
    console.log("Translating... sentence:", sentence.value, "from:", sourceLanguage.value, "to:", targetLanguage.value);

    if(isStream){
    if (unsubscribeTranslation) {
      await unsubscribeTranslation();
    }
    
    unsubscribeTranslation = await listen('translation-chunk', (event: any) => {
      translateMsg.value += event.payload;
    });
    await invoke("translate_stream", {
      sentence: sentence.value,
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value
    });
    }else{
    const response = await invoke("translate", {
      sentence: sentence.value,
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value
    });
    translateMsg.value =
      typeof response === "string" ? response.replace(/\n/g, "<br/>") : "";
    }
  } catch (error) {
    console.error("Translation failed:", error);
  } finally {
    isTranslating.value = false;
  }
}

onUnmounted(async () => {
  if (unsubscribeTranslation) {
    await unsubscribeTranslation();
  }
});
</script>

<template>
  <main>
    <form class="translate-form" @submit.prevent="translate">
      <input id="translate-input" v-model="sentence" placeholder="Enter sentence..." />

      <div class="dropdown-row">
        <div class="dropdown-container">
          <label for="sourceLanguage">FROM</label>
          <select id="sourceLanguage" v-model="sourceLanguage">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
          </select>
        </div>

        <div class="dropdown-container">
          <label for="targetLanguage">TO</label>
          <select id="targetLanguage" v-model="targetLanguage">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
          </select>
        </div>
      </div>

      <button v-if="!isTranslating" type="submit" class="translate-button">Translate</button>
      <span v-else class="translating-text">Translating...</span>
    </form>
    <div class="translate-msg" v-html="translateMsg"></div>
  </main>
</template>
<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #a1e3a1, #d4f8d4);
  font-family: 'Arial Rounded MT Bold', 'Helvetica Rounded', sans-serif;
  padding: 2rem;
  overflow: hidden;
  box-sizing: border-box;
  /* 确保padding不会导致溢出 */
}

.translate-form {
  background-color: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-sizing: border-box;
  /* 确保padding不会导致溢出 */
}

.translate-form input,
.dropdown-container select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.25rem;
  font-family: 'Arial', 'Helvetica', 'sans-serif';
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  /* 确保padding不会导致溢出 */
}

#translate-input {
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  /* 确保padding不会导致溢出 */
}

.translate-form input:focus,
.dropdown-container select:focus {
  border-color: #7dc879;
  box-shadow: 0 0 8px rgba(125, 200, 121, 0.5);
}

.dropdown-container {
  display: flex;
  flex-direction: column;
}

.dropdown-container label {
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: #555;
  font-weight: bold;
}

.translate-button {
  background-color: #7dc879;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.translate-button:hover {
  background-color: #66b764;
  transform: translateY(-2px);
}

.translate-button:active {
  background-color: #5aa653;
  transform: translateY(0);
}

.translating-text {
  font-size: 1.25rem;
  color: #555;
  text-align: center;
}

.translate-msg {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #f0fff0;
  border-left: 6px solid #7dc879;
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  /* 调整最大宽度 */
  font-size: 1.25rem;
  font-family: 'Arial', 'Helvetica', 'sans-serif';
  color: #333;
  line-height: 1.6;
  box-shadow: 0 2px 10px rgba(125, 200, 121, 0.3);
  height: 30em;
  overflow-y: auto;
  box-sizing: border-box;
  /* 确保padding不会导致溢出 */
}
</style>