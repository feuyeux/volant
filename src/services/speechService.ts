export interface SpeechParams {
  rate: number;
  pitch: number;
  volume: number;
}

export function findBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const allVoices = window.speechSynthesis.getVoices();
  
  // Get exact and partial matches
  const baseCode = langCode.split('-')[0];
  const exactMatches = allVoices.filter(voice => voice.lang === langCode);
  const partialMatches = allVoices.filter(voice => 
    voice.lang.startsWith(baseCode + '-') && voice.lang !== langCode);
  
  // Rank and select the best voice
  const rankedExact = rankVoices(exactMatches);
  const rankedPartial = rankVoices(partialMatches);
  
  if (rankedExact.length > 0) {
    return rankedExact[0].voice;
  } else if (rankedPartial.length > 0) {
    return rankedPartial[0].voice;
  }
  
  return null;
}

function rankVoices(voices: SpeechSynthesisVoice[]): Array<{voice: SpeechSynthesisVoice, score: number}> {
  return voices.map(voice => {
    let score = 0;
    
    // Premium voices usually have better quality
    if (voice.name.includes('Google')) score += 10;
    if (voice.name.includes('Apple')) score += 8;
    if (voice.name.includes('Microsoft')) score += 6;
    if (voice.name.includes('Natural')) score += 5;
    if (voice.name.includes('Premium')) score += 5;
    
    // Female voices are often clearer for many languages
    if (voice.name.includes('Female') || voice.name.includes('女')) score += 3;
    
    // Give small preference to local voices
    if (!voice.localService) score -= 1;
    
    return { voice, score };
  }).sort((a, b) => b.score - a.score);
}

export function optimizeParameters(langCode: string): SpeechParams {
  // Default parameters
  const params: SpeechParams = { rate: 0.9, pitch: 1.0, volume: 1.0 };
  
  // Language-specific adjustments
  const languageGroup = langCode.split('-')[0];
  
  switch (languageGroup) {
    case 'en': // English
      params.rate = 0.9;
      break;
    case 'fr': // French - slower for better articulation
      params.rate = 0.85;
      break;
    case 'de': // German
      params.rate = 0.85;
      break;
    case 'es': // Spanish
      params.rate = 0.9;
      break;
    case 'ru': // Russian - slower for better pronunciation
      params.rate = 0.8;
      params.pitch = 0.95;
      break;
    case 'zh': // Chinese - slightly higher pitch often sounds more natural
      params.rate = 0.9;
      params.pitch = 1.05;
      break;
    case 'ja': // Japanese
      params.rate = 0.85;
      break;
    case 'ar': // Arabic - lower pitch, slower rate for clarity
      params.rate = 0.8;
      params.pitch = 0.95;
      break;
    case 'hi': // Hindi
      params.rate = 0.85;
      break;
    case 'th': // Thai - slower for tonal clarity
      params.rate = 0.8;
      break;
    case 'el': // Greek
      params.rate = 0.85;
      break;
    case 'he': // Hebrew
      params.rate = 0.85;
      break;
    case 'ko': // Korean
      params.rate = 0.85;
      break;
  }
  
  return params;
}

export function speakText(text: string, langCode: string, 
  onStart?: () => void, onEnd?: () => void, onError?: (e: any) => void): void {
  
  // Clean text (remove HTML tags)
  const textToSpeak = text.replace(/<br\/>/g, '\n').replace(/<[^>]*>/g, '');
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Find best voice
  const selectedVoice = findBestVoice(langCode);
  
  // Configure the utterance
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = langCode;
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  // Apply optimized parameters
  const params = optimizeParameters(langCode);
  utterance.rate = params.rate;
  utterance.pitch = params.pitch;
  utterance.volume = params.volume;
  
  // Set event handlers
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;
  
  // Split long text into sentences to improve playback reliability
  if (textToSpeak.length > 100) {
    speakInChunks(textToSpeak, utterance);
  } else {
    // Speak the text directly for short content
    window.speechSynthesis.speak(utterance);
  }
}

function speakInChunks(text: string, baseUtterance: SpeechSynthesisUtterance): void {
  // Find sentence boundaries (., !, ?, etc.)
  const sentenceRegex = /[.!?;:。！？；：]/;
  let sentences = text.split(sentenceRegex);
  
  // Recreate punctuation in sentences
  sentences = sentences.map((sentence, i) => {
    const punct = i < text.length ? text.charAt(text.indexOf(sentence) + sentence.length) : '';
    return sentence.trim() + punct;
  }).filter(s => s.trim().length > 0);
  
  // Queue each sentence
  sentences.forEach((sentence, index) => {
    // Create a new utterance with the same properties
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.voice = baseUtterance.voice;
    utterance.lang = baseUtterance.lang;
    utterance.rate = baseUtterance.rate;
    utterance.pitch = baseUtterance.pitch;
    utterance.volume = baseUtterance.volume;
    
    // Only set event handlers for first and last utterance
    if (index === 0) {
      utterance.onstart = baseUtterance.onstart;
    }
    
    if (index === sentences.length - 1) {
      utterance.onend = baseUtterance.onend;
      utterance.onerror = baseUtterance.onerror;
    }
    
    // Queue this utterance
    window.speechSynthesis.speak(utterance);
  });
}

export function ensureVoicesLoaded(): Promise<void> {
  return new Promise<void>((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve();
    } else {
      // Wait for voices to be loaded
      window.speechSynthesis.onvoiceschanged = () => {
        resolve();
      };
    }
  });
}