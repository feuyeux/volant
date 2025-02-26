<script setup lang="ts">
import { ref, onUnmounted, computed } from "vue";
import { translateText } from "./services/translateService";
import { speakText, ensureVoicesLoaded } from "./services/speechService";
import { Language } from "./types";
import { UnlistenFn } from "@tauri-apps/api/event";
import './assets/styles/main.css';

const translateMsg = ref("");
const sentence = ref("");
const isTranslating = ref(false);
const sourceLanguage = ref("中文");
const targetLanguage = ref("英语");
const isStream = true;
const isSpeaking = ref(false);

// Swap language function
function swapLanguages() {
  const temp = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = temp;
}

const languages: Language[] = [
  { value: "中文", label: "Chinese", speechCode: "zh-CN" },
  { value: "英语", label: "English", speechCode: "en-US" },
  { value: "德语", label: "German", speechCode: "de-DE" },
  { value: "法语", label: "French", speechCode: "fr-FR" },
  { value: "西班牙语", label: "Spanish", speechCode: "es-ES" },
  { value: "俄语", label: "Russian", speechCode: "ru-RU" },
  { value: "希腊语", label: "Greek", speechCode: "el-GR" },
  { value: "阿拉伯语", label: "Arabic", speechCode: "ar-SA" },
  { value: "希伯来语", label: "Hebrew", speechCode: "he-IL" },
  { value: "印地语", label: "Hindi", speechCode: "hi-IN" },
  { value: "韩语", label: "Korean", speechCode: "ko-KR" },
  { value: "日语", label: "Japanese", speechCode: "ja-JP" },
  { value: "泰语", label: "Thai", speechCode: "th-TH" },
];

// Determine if target language is RTL
const isRtlLanguage = computed(() => {
  const rtlCodes = ["ar-SA", "he-IL"];
  const targetLang = languages.find(lang => lang.value === targetLanguage.value);
  return rtlCodes.includes(targetLang?.speechCode || "");
});
let unsubscribeTranslation: UnlistenFn | null = null;

async function translate() {
  if (!sentence.value.trim()) return;
  
  translateMsg.value = "";
  isTranslating.value = true;
  
  try {
    if (unsubscribeTranslation) {
      await unsubscribeTranslation();
    }
    
    const result = await translateText(
      sentence.value,
      sourceLanguage.value,
      targetLanguage.value,
      (chunk) => { translateMsg.value += chunk },
      isStream
    );
    
    if (!isStream && result.text) {
      translateMsg.value = result.text;
    }
    
    unsubscribeTranslation = result.unsubscribe || null;
    
  } catch (error) {
    console.error("Translation failed:", error);
  } finally {
    isTranslating.value = false;
  }
}

async function initSpeak() {
  await ensureVoicesLoaded();
  
  if (!translateMsg.value) return;
  
  const targetLang = languages.find(lang => lang.value === targetLanguage.value);
  const langCode = targetLang?.speechCode || 'en-US';
  
  speakText(
    translateMsg.value,
    langCode,
    () => { isSpeaking.value = true },
    () => { isSpeaking.value = false },
    () => { isSpeaking.value = false }
  );
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
  isSpeaking.value = false;
}

onUnmounted(async () => {
  if (unsubscribeTranslation) {
    await unsubscribeTranslation();
  }
  window.speechSynthesis.cancel();
});
</script>

<template>
  <main class="translator-app">
    <div class="app-header">
      <h1>Volant</h1>
    </div>
    
    <form class="translate-form" @submit.prevent="translate">
      <textarea
        v-model="sentence"
        class="text-input"
        placeholder="Enter text to translate..."
        autocomplete="off"
        autocapitalize="sentences"
        rows="3"
      ></textarea>

      <div class="language-selector">
        <div class="dropdown-container">
          <label for="sourceLanguage">FROM</label>
          <select id="sourceLanguage" v-model="sourceLanguage">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
          </select>
        </div>

        <button 
          type="button" 
          class="swap-button" 
          @click="swapLanguages"
          aria-label="Swap languages">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 16L3 12M3 12L7 8M3 12H21M17 8L21 12M21 12L17 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="dropdown-container">
          <label for="targetLanguage">TO</label>
          <select id="targetLanguage" v-model="targetLanguage">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
          </select>
        </div>
      </div>

      <button 
        v-if="!isTranslating" 
        type="submit" 
        class="translate-button"
        :disabled="!sentence.trim()">
        Translate
      </button>
      <div v-else class="translating-indicator">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>Translating</span>
      </div>
    </form>
    
    <div class="result-card" v-if="translateMsg">
      <div 
        class="translate-result" 
        v-html="translateMsg"
        :class="{ 'rtl': isRtlLanguage }"></div>
      
      <button 
        v-if="!isSpeaking" 
        @click="initSpeak" 
        class="speak-button"
        title="Read translation aloud">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      </button>
      
      <button 
        v-if="isSpeaking" 
        @click="stopSpeaking" 
        class="speak-button speaking"
        title="Stop reading">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="6" width="12" height="12"></rect>
        </svg>
      </button>
    </div>
  </main>
</template>