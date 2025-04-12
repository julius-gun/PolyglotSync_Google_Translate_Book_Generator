// main.js

let currentLanguage = 'en'; // Default language
const uiTranslationsCache = {}; // Cache for UI translations
const languageCodes = languageData.map(lang => lang.Code); // Get language codes from languageData

// Get user's preferred language from browser, if available
const userPreferredLanguage = navigator.language || navigator.userLanguage;
const browserLanguage = userPreferredLanguage.split('-')[0];
// Use the more specific browser language code if available in languageData, otherwise fallback to the base code
let detectedBrowserLang = userPreferredLanguage;
if (!languageCodes.includes(detectedBrowserLang)) {
    detectedBrowserLang = browserLanguage; // Try the base code (e.g., 'en' from 'en-US')
}
if (detectedBrowserLang && languageCodes.includes(detectedBrowserLang)) {
  currentLanguage = detectedBrowserLang;
}


const prioritizedLanguages = ['en', 'ru', 'zh', 'hi', 'es', 'fr', 'ar', 'pt', 'de'];
const allCodes = languageData.map(lang => lang.Code);
allCodes.push('auto'); // Include 'auto' for calculation
const maxCodeLength = Math.max(...allCodes.map(code => code.length));


// Helper function to create a formatted option element
function createLanguageOptionElement(langInfo) {
  const option = document.createElement('option');
  option.value = langInfo.Code;
  const code = langInfo.Code;
  const padding = '\u00A0'.repeat(maxCodeLength - code.length); // Use non-breaking spaces
  // Format: <code><padding> <flag> <EnglishName> (<NativeName>)
  option.textContent = `${code}${padding}\u00A0\u00A0${langInfo.Flag}\u00A0\u00A0${langInfo.EnglishName} (${langInfo.NativeName})`;
  return option;
}

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
        // let translatedText; // <-- REMOVE THIS LINE
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


// Modify DOMContentLoaded to set initial UI language and populate dropdowns
document.addEventListener('DOMContentLoaded', async () => {
  if (navigator.userAgent.toLowerCase().includes('firefox')) {
    const warningDiv = document.getElementById('firefox-warning');
    if (warningDiv) {
      warningDiv.classList.remove('hide');
    }
  }

  // Load UI language preference
  let preferredLanguage = null;
  try {
      preferredLanguage = localStorage.getItem('uiLanguage');
  } catch (e) {
      console.warn("Could not read UI language preference from localStorage:", e);
  }

  if (preferredLanguage && languageCodes.includes(preferredLanguage)) {
      currentLanguage = preferredLanguage;
  } else {
      // Fallback to browser language if no preference stored or invalid
  const userPreferredLanguage = navigator.language || navigator.userLanguage;
      let browserLangCode = userPreferredLanguage; // e.g., en-US
      if (!languageCodes.includes(browserLangCode)) {
          browserLangCode = userPreferredLanguage.split('-')[0]; // e.g., en
      }
      if (browserLangCode && languageCodes.includes(browserLangCode)) {
          currentLanguage = browserLangCode;
      } else {
          currentLanguage = 'en'; // Ultimate fallback
      }
  }

  // --- Initial Population (will be refined by updateUI) ---
  // Add language selector to the page (placeholder, will be replaced by updateUI)
  const languageSelectorContainer = document.getElementById('language-selector-container');
  const languageSelectorLabel = document.querySelector('#language-selector-container label');
  languageSelectorLabel.htmlFor = 'ui-language-selector';
  // Create and append a temporary selector, updateUI will replace it correctly styled.
  const tempUiSelector = document.createElement('select');
  tempUiSelector.id = 'ui-language-selector';
  languageSelectorContainer.appendChild(tempUiSelector);


  // Add placeholders for language dropdowns (will be replaced by updateUI)
  document.getElementById('sl-container').appendChild(document.createElement('select'));
  document.getElementById('tl1-container').insertBefore(document.createElement('select'), document.querySelector('#tl1-container .add-lang-button'));
  // Add placeholders for hidden dropdowns too, so updateUI can replace them
  document.getElementById('tl2-container').insertBefore(document.createElement('select'), document.querySelector('#tl2-container .add-lang-button'));
  document.getElementById('tl3-container').insertBefore(document.createElement('select'), document.querySelector('#tl3-container .add-lang-button'));
  document.getElementById('tl4-container').insertBefore(document.createElement('select'), document.querySelector('#tl4-container .remove-lang-button'));


  // --- Call updateUI to correctly populate everything and translate ---
  await updateUI(); // This will now handle initial population and translation

  // Attach event listeners after the initial UI is built
  attachEventListeners();
});

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




function displayTranslatedBatch(batch, translations, sourceLang, targetLangs) {
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
      if (translations[targetLang] && translations[targetLang][i] !== undefined) {
        targetPara.textContent = translations[targetLang][i];
      } else {
        // translations object is defined in translations.js, currentLanguage is global here
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

//Rest of the code

function splitIntoSentences(text) {
  const sentenceRegex = /(?<!\p{Lu}\.\p{Ll}\.)(?<![A-Z][a-z]\.)(?<![A-Z]\.)(?<!etc\.)(?<!e\.g\.)(?<!i\.e\.)(?<!\p{Lu}\.)(?<=\.|\?|!|。|？|！)(?:\s+)(?=(?:\p{Lu}|\p{N}|\s))/gu;
  let sentences = text.replace(/\n/g, " ").split(sentenceRegex);  // Split and handle newlines
  return sentences.filter(sentence => sentence.trim() !== ""); // Remove empty sentences
}


// NEW FUNCTION: Merge short sentences
function mergeShortSentences(sentences) {
  const mergedSentences = [];
  const minLength = 7; // Minimum length for a sentence
  let previousSentence = "";

  for (const sentence of sentences) {
    if (sentence.trim().length < minLength && previousSentence.length > 0) {
      // Merge with the previous sentence
      previousSentence = previousSentence.trimEnd() + " " + sentence;
    } else {
      // Add the previous sentence (if any) to the result
      if (previousSentence.length > 0) {
        mergedSentences.push(previousSentence);
      }
      previousSentence = sentence;
    }
  }

  // Add the last sentence
  if (previousSentence.length > 0) {
    mergedSentences.push(previousSentence);
  }

  return mergedSentences;
}

function createTranslationBatches(sentences, maxLength) {
  const batches = [];
  let currentBatch = [];
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length + 1; // +1 for the newline

    if (currentLength + sentenceLength > maxLength && currentBatch.length > 0) {
      // If adding the sentence exceeds the max length, start a new batch
      batches.push(currentBatch);
      currentBatch = [];
      currentLength = 0;
    }

    currentBatch.push(sentence);
    currentLength += sentenceLength;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch); // Add the last batch
  }

  return batches;
}


function toggleTheme() {
  const body = document.body;
  body.classList.toggle('bw');
}
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

function saveEpub() {
  // Reuse makeBook function, but we need to get the translated text
  // For simplicity, let's just grab the content from the output div for now.
  // A more robust solution might involve reconstructing the text from the sentences and translations.
  const translatedBookContent = document.getElementById('output').innerText;
  makeBook(translatedBookContent); // Pass the content to makeBook
}

function makeBook(text) {
  const zip = new JSZip();
  const mimetype = "application/epub+zip";
  const meta = `<?xml version="1.0" encoding="UTF-8"?>
  <package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:title>Bilingual Book</dc:title>
      <dc:language>en</dc:language>
      <dc:identifier id="bookid">12345</dc:identifier>
      <dc:creator>Lachlan Dauth</dc:creator>
  </metadata>
  <manifest>
      <item href="toc.ncx" media-type="application/x-dtbncx+xml" id="ncx"/>
      <item href="chapter1.xhtml" media-type="application/xhtml+xml" id="chapter1"/>
      <item href="chapter2.xhtml" media-type="application/xhtml+xml" id="chapter2"/>
  </manifest>
  <spine toc="ncx">
      <itemref idref="chapter1"/>
  </spine>
  </package>`;
  const toc = `<?xml version="1.0" encoding="UTF-8"?>
  <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
      <meta name="dtb:uid" content="12345"/>
      <meta name="dtb:depth" content="1"/>
      <meta name="dtb:totalPageCount" content="0"/>
      <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
      <text>Bilingual Book</text>
  </docTitle>
  </ncx>`;
  const chapter1 = `<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
      <title>Chapter 1</title>
  </head>
  <body>
      ` + text + `
  </body>
  </html>`;

  zip.file("mimetype", mimetype);
  zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
  <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
          <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
  </container>`);
  zip.file("content.opf", meta);
  zip.file("toc.ncx", toc);
  zip.file("chapter1.xhtml", chapter1);

  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, "Bilingual Book.epub");
  });
}

function sleep(min_ms = 1, max_ms = 5) {
  const random_ms = Math.random() * (max_ms - min_ms) + min_ms;
  return new Promise(resolve => setTimeout(resolve, random_ms));
}


function toggleInfo() {
  const infoElement = document.querySelector("#info");
  infoElement.classList.toggle("hide");
}

function reloadPage() {
  window.location.reload();
}


async function generateBilingualBook() {
  console.log("Generate button clicked"); // ADDED: Debug log
  const sourceText = document.getElementById('source-text').value;
  let sourceLang = document.getElementById('sl').value;

  if (sourceLang === 'auto') {
    sourceLang = await detectLanguage(sourceText) || 'en'; // Default to English if detection fails
  }
  const targetLangs = [];
  const maxLanguages = 4;
  // Collect target languages from visible dropdowns
  for (let i = 1; i <= maxLanguages; i++) {
    const container = document.getElementById(`tl${i}-container`);
    if (!container.classList.contains('hide')) {
      const select = document.getElementById(`tl${i}`);
      if (select && select.value) {
        targetLangs.push(select.value);
      }
    }
  }

  const bookContainer = document.getElementById('output');
  bookContainer.innerHTML = '';

  // Show progress bar
  document.getElementById('progress-container').style.display = 'block';
  document.getElementById('progress-info').style.display = 'block'; // Ensure progress info is visible

  const sentences = splitIntoSentences(sourceText);
  const mergedSentences = mergeShortSentences(sentences); // Merge short sentences
  const batches = createTranslationBatches(mergedSentences, 600);  // 600 char limit
  const totalSentences = mergedSentences.length;
  let translatedSentencesCount = 0;
  let startTime = Date.now();

  // Initialize progress bar
  updateProgress(0, totalSentences, startTime);

  // Translate batches concurrently
  const translationPromises = batches.map(batch =>
    translateBatch(batch, sourceLang, targetLangs, currentLanguage)
  );

  // Use Promise.all to wait for all batches, but process each as it completes
  for (const promise of translationPromises) {
    const { batch: translatedBatch, translations: batchTranslations } = await promise; // Renamed local variable
    displayTranslatedBatch(translatedBatch, batchTranslations, sourceLang, targetLangs);

    translatedSentencesCount += translatedBatch.length;
    updateProgress(translatedSentencesCount, totalSentences, startTime);
    await sleep(100, 300); // Random delay
  }

  // --- MODIFICATION START ---
  // Comment out or remove the lines that delete the '.del' element
  // const elementToDelete = document.querySelector('.del');
  // if (elementToDelete) {
  //   elementToDelete.remove();
  // }

  // Optionally keep or remove the info element
  const infoElement = document.querySelector('#info');
  if (infoElement) {
    infoElement.remove(); // Keep this line if you still want to remove the info box
  }

  // Comment out or remove this line as it's likely not needed anymore
  // text = document.body.innerHTML.replaceAll(" ", "");
  // --- MODIFICATION END ---


  document.getElementById('translation-finished-message').classList.remove('hide');
  // Remove 'hide' class from each button individually
  document.getElementById('open-book-view-button').classList.remove('hide');
  document.getElementById('save-epub-button').classList.remove('hide');
  document.getElementById('reload-page-button').classList.remove('hide');

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
function copy() {
  // Get the text field
  var text = "Hello World";

  // Copy the text inside the text field
  navigator.clipboard.writeText(text);
}