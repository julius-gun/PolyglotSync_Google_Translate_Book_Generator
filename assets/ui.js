// Contains functions for UI manipulation, event handling, and UI helpers

// Helper function to create a formatted option element
// Depends on: maxCodeLength (global from main.js), languageData (global from language_data.js)
function createLanguageOptionElement(langInfo) {
    const option = document.createElement('option');
    option.value = langInfo.Code;
    const code = langInfo.Code;
    const padding = '\u00A0'.repeat(maxCodeLength - code.length); // Use non-breaking spaces
    // Format: <code><padding> <flag> <EnglishName> (<NativeName>)
    option.textContent = `${code}${padding}\u00A0\u00A0${langInfo.Flag}\u00A0\u00A0${langInfo.EnglishName} (${langInfo.NativeName})`;
    return option;
  }
  
  // Depends on: createLanguageOptionElement, fetchTranslation (from translation_api.js),
  // translations (global from ui_translations.js), currentLanguage (global from main.js),
  // maxCodeLength (global from main.js), languageData (global from language_data.js),
  // prioritizedLanguages (global from config.js)
  async function createLanguageDropdown(id) {
    const select = document.createElement('select');
    select.id = id;
    const isSourceLanguage = id === 'sl';
  
    // Add Autodetect option for source language
    if (isSourceLanguage) {
      const autoDetectOption = document.createElement('option');
      autoDetectOption.value = 'auto';
      // Fetch translation for "Autodetect Language" using the existing mechanism
      const autoDetectText = await fetchTranslation(translations['en'].languages['auto'], currentLanguage);
      const code = 'auto';
      const padding = '\u00A0'.repeat(maxCodeLength - code.length); // Use non-breaking spaces
      // Format: <code><padding> <icon> <TranslatedText>
      autoDetectOption.textContent = `${code}${padding}\u00A0\u00A0🌐\u00A0\u00A0${autoDetectText}`;
      autoDetectOption.selected = true;
      select.appendChild(autoDetectOption);
    }
  
    // Separate prioritized and other languages from languageData
    const prioritizedOptions = [];
    const otherOptions = [];
  
    // Sort languageData by Code for the main list
    const sortedLanguageData = [...languageData].sort((a, b) => a.Code.localeCompare(b.Code));
  
    sortedLanguageData.forEach(langInfo => {
      const optionElement = createLanguageOptionElement(langInfo);
      if (prioritizedLanguages.includes(langInfo.Code)) {
        prioritizedOptions.push(optionElement);
      }
      otherOptions.push(optionElement.cloneNode(true)); // Clone for the 'all' list
    });
  
    // Create optgroup for prioritized languages
    if (prioritizedOptions.length > 0) {
      const prioritizedGroup = document.createElement('optgroup');
      prioritizedGroup.label = "--- Prioritized ---"; // Clearer separator
      prioritizedOptions.forEach(option => prioritizedGroup.appendChild(option));
      select.appendChild(prioritizedGroup);
    }
  
    // Create optgroup for all other languages (sorted by code)
    const othersGroup = document.createElement('optgroup');
    othersGroup.label = "--- All Languages ---"; // Clearer separator
    otherOptions.forEach(option => othersGroup.appendChild(option));
    select.appendChild(othersGroup);
  
  
    return select;
  }
  
  // Depends on: updateUI, currentLanguage (global from main.js)
  function setLanguage(lang) {
    currentLanguage = lang;
    // Store preference
    try {
        localStorage.setItem('uiLanguage', lang);
    } catch (e) {
        console.warn("Could not save UI language preference to localStorage:", e);
    }
    updateUI();
  }
  
  // Depends on: fetchTranslation (from translation_api.js), translations (global from ui_translations.js),
  // createLanguageDropdown, createLanguageSelector, attachEventListeners, currentLanguage (global from main.js)
  async function updateUI() {
    const uiElements = {
      pageTitle: document.querySelector('h1'),
      sourceLabel: document.querySelector('#sl-container label'),
      targetLabel1: document.querySelector('#tl1-container label'),
      targetLabel2: document.querySelector('#tl2-container label'),
      targetLabel3: document.querySelector('#tl3-container label'),
      targetLabel4: document.querySelector('#tl4-container label'),
      enterText: document.querySelector('#source-text'),
      generateButton: document.querySelector('#generate-button'), // Corrected selector ID
      toggleThemeButton: document.querySelector('#toggle-theme-button'), // Corrected selector ID
      translatedSpan: document.querySelector('#progress-info span:first-child'),
      etaSpan: document.querySelector('#progress-info span:last-child'),
      uiLanguageLabel: document.querySelector('#ui-language-label span:last-child'),
      openBookViewButton: document.querySelector('#open-book-view-button'),
      saveEpubButton: document.querySelector('#save-epub-button'),
      reloadPageButton: document.querySelector('#reload-page-button'),
      translationFinishedMessage: document.querySelector('#translation-finished-message'),
      enterSourceTextLabel: document.querySelector('h3'), // New label
    };
  
    for (const key in uiElements) {
      // Check if the key exists in the base English translations
      if (uiElements.hasOwnProperty(key) && translations['en'][key]) {
        const element = uiElements[key];
        if (element) {
          const englishText = translations['en'][key];
          // Fetch translation for the UI element text itself
          const translatedText = await fetchTranslation(englishText, currentLanguage);
  
          if (key === 'enterText') {
            element.placeholder = translatedText;
          } else if (key === 'translatedSpan') {
            // Special handling for progress info - needs translated "Translated" word
            const translatedWord = await fetchTranslation(translations['en'].translated, currentLanguage);
            const currentProgressText = element.textContent; // Get current numbers
            const numbersMatch = currentProgressText.match(/(\d+)\s*\/\s*(\d+)/);
            const currentTranslated = numbersMatch ? numbersMatch[1] : '0';
            const currentTotal = numbersMatch ? numbersMatch[2] : '0';
            element.textContent = `${translatedWord}: ${currentTranslated} / ${currentTotal}`;
          } else if (key === 'etaSpan') {
            // Special handling for progress info - needs translated "ETA" word
            const translatedWord = await fetchTranslation(translations['en'].eta, currentLanguage);
             const currentEtaText = element.textContent; // Get current time
             const timeMatch = currentEtaText.split(': ')[1]; // Get the part after ": "
             const currentTime = timeMatch ? timeMatch : 'Calculating...';
            element.textContent = `${translatedWord}: ${currentTime}`;
          } else if (key === 'uiLanguageLabel') {
            const translatedWord = await fetchTranslation(translations['en'].uiLanguage, currentLanguage);
            element.textContent = `${translatedWord}:`;
          } else {
            // For buttons, labels, titles, etc.
            element.textContent = translatedText;
          }
        }
      }
    }
  
    // --- Re-render language dropdowns using the new functions ---
    const slContainer = document.getElementById('sl-container');
    const tl1Container = document.getElementById('tl1-container');
    const tl2Container = document.getElementById('tl2-container');
    const tl3Container = document.getElementById('tl3-container');
    const tl4Container = document.getElementById('tl4-container');
    const uiLangContainer = document.getElementById('language-selector-container');
  
    const currentSlValue = slContainer.querySelector('select')?.value;
    const currentTl1Value = tl1Container.querySelector('select')?.value;
    const currentTl2Value = tl2Container.querySelector('select')?.value;
    const currentTl3Value = tl3Container.querySelector('select')?.value;
    const currentTl4Value = tl4Container.querySelector('select')?.value;
    const currentUiLangValue = uiLangContainer.querySelector('select')?.value;
  
    // Replace existing selects or create if they don't exist
    const newSlSelect = await createLanguageDropdown('sl');
    const oldSlSelect = slContainer.querySelector('select');
    if (oldSlSelect) oldSlSelect.replaceWith(newSlSelect); else slContainer.appendChild(newSlSelect);
    if (currentSlValue) newSlSelect.value = currentSlValue;
  
    const newTl1Select = await createLanguageDropdown('tl1');
    const oldTl1Select = tl1Container.querySelector('select');
    if (oldTl1Select) oldTl1Select.replaceWith(newTl1Select); else tl1Container.insertBefore(newTl1Select, tl1Container.querySelector('.add-lang-button'));
    if (currentTl1Value) newTl1Select.value = currentTl1Value;
  
    if (!tl2Container.classList.contains('hide')) {
        const newTl2Select = await createLanguageDropdown('tl2');
        const oldTl2Select = tl2Container.querySelector('select');
        if (oldTl2Select) oldTl2Select.replaceWith(newTl2Select); else tl2Container.insertBefore(newTl2Select, tl2Container.querySelector('.add-lang-button'));
        if (currentTl2Value) newTl2Select.value = currentTl2Value;
    }
     if (!tl3Container.classList.contains('hide')) {
        const newTl3Select = await createLanguageDropdown('tl3');
        const oldTl3Select = tl3Container.querySelector('select');
        if (oldTl3Select) oldTl3Select.replaceWith(newTl3Select); else tl3Container.insertBefore(newTl3Select, tl3Container.querySelector('.add-lang-button'));
        if (currentTl3Value) newTl3Select.value = currentTl3Value;
    }
     if (!tl4Container.classList.contains('hide')) {
        const newTl4Select = await createLanguageDropdown('tl4');
        const oldTl4Select = tl4Container.querySelector('select');
        if (oldTl4Select) oldTl4Select.replaceWith(newTl4Select); else tl4Container.insertBefore(newTl4Select, tl4Container.querySelector('.remove-lang-button'));
        if (currentTl4Value) newTl4Select.value = currentTl4Value;
    }
  
    // Update UI language selector
    const newUiLangSelect = await createLanguageSelector();
    const oldUiLangSelect = uiLangContainer.querySelector('select');
     if (oldUiLangSelect) oldUiLangSelect.replaceWith(newUiLangSelect); else uiLangContainer.appendChild(newUiLangSelect);
    // Set the value *after* replacing/appending
    newUiLangSelect.value = currentLanguage; // Ensure the current UI language is selected
  
  
    // Re-attach event listeners (important after replacing elements)
    attachEventListeners(); // Encapsulate listener attachment
  }
  
  // --- Modified createLanguageSelector ---
  // Depends on: createLanguageOptionElement, setLanguage, languageData (global from language_data.js),
  // prioritizedLanguages (global from config.js), currentLanguage (global from main.js)
  async function createLanguageSelector() {
    const select = document.createElement('select');
    select.id = 'ui-language-selector';
    select.classList.add('ui-language-select'); // Add class for styling
  
    // Separate prioritized and other languages from languageData
    const prioritizedOptions = [];
    const otherOptions = [];
  
    // Sort languageData by Code for the main list
    const sortedLanguageData = [...languageData].sort((a, b) => a.Code.localeCompare(b.Code));
  
    sortedLanguageData.forEach(langInfo => {
      // Use the helper function to create the option element
      const optionElement = createLanguageOptionElement(langInfo);
      if (prioritizedLanguages.includes(langInfo.Code)) {
        prioritizedOptions.push(optionElement);
      }
      otherOptions.push(optionElement.cloneNode(true)); // Clone for the 'all' list
    });
  
    // Create optgroup for prioritized languages
    if (prioritizedOptions.length > 0) {
      const prioritizedGroup = document.createElement('optgroup');
      prioritizedGroup.label = "--- Prioritized ---"; // Clearer separator
      prioritizedOptions.forEach(option => prioritizedGroup.appendChild(option));
      select.appendChild(prioritizedGroup);
    }
  
    // Create optgroup for all other languages (sorted by code)
    const othersGroup = document.createElement('optgroup');
    othersGroup.label = "--- All Languages ---"; // Clearer separator
    otherOptions.forEach(option => othersGroup.appendChild(option));
    select.appendChild(othersGroup);
  
    select.value = currentLanguage; // Set initial value
    select.addEventListener('change', (event) => {
      setLanguage(event.target.value);
    });
  
    return select;
  }
  // --- End of Modified createLanguageSelector ---
  
  // Helper function to attach event listeners
  // Depends on: generateBilingualBook (global from main.js), toggleTheme, openBookView,
  // saveEpub (from epub_generator.js), reloadPage, showTargetLang, hideTargetLang
  function attachEventListeners() {
      const generateButton = document.getElementById('generate-button');
      if (generateButton) generateButton.addEventListener('click', generateBilingualBook);
  
      const toggleThemeButton = document.getElementById('toggle-theme-button');
      if (toggleThemeButton) toggleThemeButton.addEventListener('click', toggleTheme);
  
      const openBookViewButton = document.getElementById('open-book-view-button');
      if (openBookViewButton) openBookViewButton.addEventListener('click', openBookView);
  
      const saveEpubButton = document.getElementById('save-epub-button');
      if (saveEpubButton) saveEpubButton.addEventListener('click', saveEpub);
  
      const reloadPageButton = document.getElementById('reload-page-button');
      if (reloadPageButton) reloadPageButton.addEventListener('click', reloadPage);
  
      // Add/Remove buttons for target languages (ensure listeners are attached if buttons exist)
      document.querySelectorAll('.add-lang-button').forEach(button => {
          const targetContainerId = button.getAttribute('onclick')?.match(/'(tl\d+-container)'/)?.[1];
          if (targetContainerId) {
              button.onclick = () => showTargetLang(targetContainerId); // Re-assign using function reference
          }
      });
      document.querySelectorAll('.remove-lang-button').forEach(button => {
          const targetContainerId = button.getAttribute('onclick')?.match(/'(tl\d+-container)'/)?.[1];
           if (targetContainerId) {
              button.onclick = () => hideTargetLang(targetContainerId); // Re-assign using function reference
          }
      });
  
      // UI language selector listener is attached within createLanguageSelector
  }
  
  // Depends on: updateUI, attachEventListeners
  function showTargetLang(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return; // Safety check
  
    // Ensure select exists before trying to get value
    const selectElement = container.querySelector('select');
    const selectedLanguage = selectElement ? selectElement.value : null;
  
    container.classList.remove('hide');
  
    // Crucially, call updateUI *after* showing the container
    // so it can correctly create/replace the select element if needed.
    updateUI().then(() => {
        // Re-apply the value *after* updateUI has finished and potentially replaced the select
        const newSelectElement = document.getElementById(containerId)?.querySelector('select');
        if (newSelectElement && selectedLanguage) {
            newSelectElement.value = selectedLanguage;
    }
        // Ensure event listeners are re-attached after potential DOM changes by updateUI
        attachEventListeners();
    });
  }
  
  function hideTargetLang(containerId) {
    const container = document.getElementById(containerId);
     if (!container) return; // Safety check
  
    // Optionally clear the value of the select being hidden
    const selectElement = container.querySelector('select');
    if (selectElement) {
        selectElement.value = ''; // Or set to a default if applicable
    }
  
    container.classList.add('hide');
    // No need to call updateUI here unless hiding affects other elements' layout significantly
    // We might need to re-attach listeners if updateUI isn't called
    // attachEventListeners(); // Consider if needed
  }
  
  function toggleTheme() {
    const body = document.body;
    body.classList.toggle('bw');
  }
  
  // Depends on: translations (global from ui_translations.js), currentLanguage (global from main.js)
  function displayTranslatedBatch(batch, translationsData, sourceLang, targetLangs) { // Renamed 'translations' param
    const bookContainer = document.getElementById('output');
  
    for (let i = 0; i < batch.length; i++) {
      const paragraph = document.createElement('div');
      paragraph.style.display = "flex";
      paragraph.style.justifyContent = "space-between";
      paragraph.style.gap = "10px";
      paragraph.style.marginBottom = "10px";
      paragraph.className = 'paragraph';
  
      const sourcePara = document.createElement('div');
      sourcePara.className = 'source';
      sourcePara.textContent = batch[i];
      paragraph.appendChild(sourcePara);
  
      if (['ar', 'he', 'fa', 'ur', 'ks', 'ps', 'ug', 'ckb', 'pa', 'sd'].includes(sourceLang)) {
        sourcePara.className += " rtl";
      }
  
      for (const targetLang of targetLangs) {
        const targetPara = document.createElement('div');
        targetPara.className = 'lang-column';
        // Check if the translated sentence exists and is not undefined
        if (translationsData[targetLang] && translationsData[targetLang][i] !== undefined) {
          targetPara.textContent = translationsData[targetLang][i];
        } else {
          // translations object is defined in ui_translations.js, currentLanguage is global here
          const errorMsg = translations[currentLanguage]?.translationError || translations['en'].translationError; //Fallback to english if currentLanguage is not loaded yet.
          targetPara.textContent = errorMsg;
        }
  
  
        if (['ar', 'he', 'fa', 'ur', 'ks', 'ps', 'ug', 'ckb', 'pa', 'sd'].includes(targetLang)) {
          targetPara.className += " rtl";
        }
        paragraph.appendChild(targetPara);
      }
  
      bookContainer.appendChild(paragraph);
    }
  }
  
  // Depends on: translations (global from ui_translations.js), currentLanguage (global from main.js), formatTime
  function updateProgress(translated, total, startTime) {
    const progressBar = document.getElementById('progress-bar');
    const progressInfo = document.getElementById('progress-info');
    const percent = total === 0 ? 0 : Math.round((translated / total) * 100);
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  
    const elapsedTime = Date.now() - startTime;
    const estimatedTotalTime = total === 0 ? 0 : (elapsedTime * (total / translated));
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime); // Prevent negative time
  
    // Defensive check: Ensure translations[currentLanguage] exists before accessing properties
    const currentLangTranslations = translations[currentLanguage] || translations['en']; // Fallback to English if not loaded
    const translatedText = currentLangTranslations.translated;
    const etaText = currentLangTranslations.eta;
  
    progressInfo.innerHTML = `
          <span>${translatedText}: ${translated} / ${total}</span> |
          <span>${etaText}: ${formatTime(estimatedTimeRemaining)}</span>
      `;
  }
  
  function formatTime(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
  
    seconds = seconds % 60;
    minutes = minutes % 60;
  
    let timeString = '';
    if (hours > 0) {
      timeString += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`;
  
    return timeString.trim();
  }
  
  function openBookView() {
    const outputContent = document.getElementById('output').innerHTML;
    const styles = document.head.querySelectorAll('style'); // Get all style tags
    const themeClass = document.body.className; // Get current theme class (e.g., 'bw')
    let styleContent = '';
    styles.forEach(style => {
      styleContent += style.innerHTML + '\n'; // Concatenate content of all style tags
    });
  
    const bookViewWindow = window.open('', '_blank');
    if (bookViewWindow) {
      bookViewWindow.document.open();
      bookViewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Add some basic padding to the book view body */
            body {
              padding: 20px;
            }
            ${styleContent}
          </style>
        </head>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Add some basic padding to the book view body */
            ${styleContent}
          </style>
        </head>
        <body class="${themeClass}">
          <hr>
          ${outputContent}
        </body>
        </html>
      `);
      bookViewWindow.document.close();
    } else {
      alert('Could not open book view window. Please check your popup blocker settings.');
    }
  }
  
  function reloadPage() {
    window.location.reload();
  }
  
  function toggleInfo() {
    const infoElement = document.querySelector("#info");
    if (infoElement) { // Check if element exists
        infoElement.classList.toggle("hide");
    }
  }
  
  function copy() {
    // Get the text field
    var text = "Hello World"; // Example text, likely needs modification
  
    // Copy the text inside the text field
    navigator.clipboard.writeText(text);
  }