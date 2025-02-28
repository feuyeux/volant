import { ref, onUnmounted, computed , onMounted  } from "vue";
import { translateText } from "../../services/translateService";
import { speakText, ensureVoicesLoaded } from "../../services/speechService";
import { UnlistenFn } from "@tauri-apps/api/event";

interface Language {
  value: string;
  label: string;
  speechCode: string;
  rtl?: boolean;
}

interface TranslationHistoryItem {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  timestamp: number;
}

export function useTranslator() {
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
      addToHistory(translateMsg.value);
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

  // Add history state
  const translationHistory = ref<TranslationHistoryItem[]>([]);
  const showHistory = ref(false);

  // Load history from localStorage on mount
  onMounted(() => {
    const savedHistory = localStorage.getItem('translation_history');
    if (savedHistory) {
      try {
        translationHistory.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error('Failed to parse translation history', e);
        translationHistory.value = [];
      }
    }
  });

  // Add translation to history
  const addToHistory = (translatedText: string) => {
    const historyItem: TranslationHistoryItem = {
      id: Date.now().toString(),
      sourceLanguage: sourceLanguage.value,
      targetLanguage: targetLanguage.value,
      originalText: sentence.value,
      translatedText,
      timestamp: Date.now()
    };

    translationHistory.value = [historyItem, ...translationHistory.value.slice(0, 19)]; // Keep only 20 most recent
    localStorage.setItem('translation_history', JSON.stringify(translationHistory.value));
  };

  // Use a specific history item
  const useHistoryItem = (item: TranslationHistoryItem) => {
    sourceLanguage.value = item.sourceLanguage;
    targetLanguage.value = item.targetLanguage;
    sentence.value = item.originalText;
    translateMsg.value = item.translatedText;
  };

  // Clear history
  const clearHistory = () => {
    translationHistory.value = [];
    localStorage.removeItem('translation_history');
  };

  // Toggle history visibility
  const toggleHistory = () => {
    showHistory.value = !showHistory.value;
  };
  
  onUnmounted(async () => {
    if (unsubscribeTranslation) {
      await unsubscribeTranslation();
    }
    window.speechSynthesis.cancel();
  });

  return {
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
    clearHistory,
  };
}