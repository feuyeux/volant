<script setup lang="ts">
import { useTranslator } from './TranslatorApp';
import './TranslatorApp.css';

const {
    translateMsg,
    sentence,
    isTranslating,
    sourceLanguage,
    targetLanguage,
    languages,
    isRtlLanguage,
    isSpeaking,
    translate,
    swapLanguages,
    initSpeak,
    stopSpeaking,
    translationHistory,
    showHistory,
    toggleHistory,
    useHistoryItem,
    clearHistory
} = useTranslator();
</script>

<template>
    <main class="translator-app" :class="{ 'with-history': showHistory }">
        <!-- History panel - moved to left side -->
        <aside class="history-panel" v-if="showHistory">
            <div class="history-header">
                <h2>Translation History</h2>
                <button @click="clearHistory" class="clear-history-btn" title="Clear history">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <div class="history-list-container">
                <div class="history-list" v-if="translationHistory.length > 0">
                    <div v-for="item in translationHistory" :key="item.id" class="history-item"
                        @click="useHistoryItem(item)">
                        <div class="history-item-languages">
                            {{languages.find(l => l.value === item.sourceLanguage)?.label || item.sourceLanguage}} →
                            {{languages.find(l => l.value === item.targetLanguage)?.label || item.targetLanguage}}
                        </div>
                        <div class="history-item-text">
                            <div class="original-text">{{ item.originalText.substring(0, 50) }}{{
                                item.originalText.length >
                                    50 ? '...' : '' }}</div>
                            <div class="translated-text">{{ item.translatedText.substring(0, 50) }}{{
                                item.translatedText.length > 50 ? '...' : '' }}</div>
                        </div>
                        <div class="history-item-time">{{ new Date(item.timestamp).toLocaleString() }}</div>
                    </div>
                </div>
                <div v-else class="empty-history">
                    No translation history yet
                </div>
            </div>
        </aside>

        <div class="translator-content">
            <div class="app-header">
                <h1>Volant</h1>
                <button class="history-toggle-btn" @click="toggleHistory"
                    :title="showHistory ? 'Hide History' : 'Translation History'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <polyline points="23 20 23 14 17 14"></polyline>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                    </svg>
                </button>
            </div>

            <form class="translate-form" @submit.prevent="translate">
                <textarea v-model="sentence" class="text-input" placeholder="Enter text to translate..."
                    autocomplete="off" autocapitalize="sentences" rows="3" :disabled="isTranslating"></textarea>

                <div class="language-selector">
                    <div class="dropdown-container">
                        <label for="sourceLanguage">FROM</label>
                        <select id="sourceLanguage" v-model="sourceLanguage" :disabled="isTranslating">
                            <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}
                            </option>
                        </select>
                    </div>

                    <button type="button" class="swap-button" @click="swapLanguages" aria-label="Swap languages"
                        :disabled="isTranslating">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 16L3 12M3 12L7 8M3 12H21M17 8L21 12M21 12L17 16" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>

                    <div class="dropdown-container">
                        <label for="targetLanguage">TO</label>
                        <select id="targetLanguage" v-model="targetLanguage" :disabled="isTranslating">
                            <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <button v-if="!isTranslating" type="submit" class="translate-button" :disabled="!sentence.trim()">
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
                <div class="translate-result" v-html="translateMsg" :class="{ 'rtl': isRtlLanguage }"></div>

                <button v-if="!isSpeaking" @click="initSpeak" class="speak-button" title="Read translation aloud">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </button>

                <button v-if="isSpeaking" @click="stopSpeaking" class="speak-button speaking" title="Stop reading">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6" y="6" width="12" height="12"></rect>
                    </svg>
                </button>
            </div>
        </div>
    </main>
</template>