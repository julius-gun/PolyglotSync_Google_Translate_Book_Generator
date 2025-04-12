// Contains functions for interacting with the translation API and cookies

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, expiryDays = 30) {
  const date = new Date();
  date.setDate(date.getDate() + expiryDays);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

async function detectLanguage(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[2]) {
      return data[2]; // Language code is usually in data[2]
    } else {
      console.warn('Language detection failed or no language code returned.');
      return null;
    }
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}

async function fetchTranslation(text, targetLang) {
  // --- Add check for 'Autodetect Language' specifically ---
  // Accesses the global 'translations' object defined in ui_translations.js
  if (text === translations['en'].languages['auto'] && targetLang === 'en') {
      return translations['en'].languages['auto']; // Return the English version directly
  }
  // --- End of Add check ---

  if (targetLang === 'en') return text; // No translation needed for English UI elements

  const sourceLang = 'en';
  // Use a more robust key for caching, handling potential special characters
  const cacheKey = `ui_translation_${targetLang}_${encodeURIComponent(text)}`;
  // Uses getCookie (defined above)
  const cachedTranslation = getCookie(cacheKey);

  if (cachedTranslation) {
    // Decode the cached translation in case it was encoded
    try {
        return decodeURIComponent(cachedTranslation);
    } catch (e) {
        console.warn("Could not decode cached translation, fetching again.", e);
        // Clear the potentially corrupted cookie
        // Uses setCookie (defined above)
        setCookie(cacheKey, '', -1); // Set expiry in the past to delete
    }
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const translatedText = data[0][0][0];
    // Encode the translation before storing in cookie
    // Uses setCookie (defined above)
    setCookie(cacheKey, encodeURIComponent(translatedText));
    return translatedText;
  } catch (error) {
    console.error('UI Translation error for text:', text, 'to lang:', targetLang, error);
    return text; // Fallback to original text on error
  }
}

async function translateBatch(batch, sourceLang, targetLangs, currentUiLang) {
  const batchText = batch.join('\n'); // Join sentences with newlines
  const translationsResult = {}; // Renamed to avoid conflict with global translations object

  for (const targetLang of targetLangs) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(batchText)}`;
      let response = await fetch(url);
      let data = await response.json();
      data.splice(data.length - 7, 7);
      let translatedText = data[0].map(item => item[0]).join("");

      // Basic length check (you might want more sophisticated checks)
      if (translatedText.length < 0.4 * batchText.length) {
        console.log(`Re-translating batch to ${targetLang} due to length`);
        response = await fetch(url); // Re-fetch
        data = await response.json();
        data.splice(data.length - 7, 7);
        translatedText = data[0].map(item => item[0]).join("");
      }
      translationsResult[targetLang] = translatedText.split('\n'); //split back
    } catch (error) {
      console.error('Translation error:', error);
      // Use the passed currentUiLang parameter to get the correct error message
      // Accesses the global 'translations' object defined in ui_translations.js
      const errorMsg = translations[currentUiLang]?.translationError || translations['en'].translationError; //Fallback to english if currentUiLang is not loaded yet.
      translationsResult[targetLang] = batch.map(() => errorMsg);
    }
  }

  return { batch, translations: translationsResult }; // Return the results under the 'translations' key as expected
}