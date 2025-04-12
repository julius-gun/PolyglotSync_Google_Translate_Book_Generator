// Contains text processing utility functions

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

function sleep(min_ms = 1, max_ms = 5) {
  const random_ms = Math.random() * (max_ms - min_ms) + min_ms;
  return new Promise(resolve => setTimeout(resolve, random_ms));
}