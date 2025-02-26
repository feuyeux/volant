import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

type UnsubscribeFn = () => Promise<void>;

export async function translateText(
  sentence: string,
  sourceLanguage: string,
  targetLanguage: string,
  onChunk?: (chunk: string) => void,
  isStream = true
): Promise<{ text: string; unsubscribe?: UnsubscribeFn }> {
  if (!sentence.trim()) {
    console.warn("Sentence is empty. Translation aborted.");
    return { text: "" };
  }

  try {
    if (isStream) {
      // Stream translation
      let unsubscribe = await listen('translation-chunk', (event: any) => {
        if (onChunk) onChunk(event.payload);
      });

      await invoke("translate_stream", {
        sentence,
        sourceLanguage,
        targetLanguage
      });
      
      return { text: "", unsubscribe };
    } else {
      // Direct translation
      const response = await invoke("translate", {
        sentence,
        sourceLanguage,
        targetLanguage
      });
      
      return { 
        text: typeof response === "string" ? response.replace(/\n/g, "<br/>") : "" 
      };
    }
  } catch (error) {
    console.error("Translation failed:", error);
    return { text: "" };
  }
}