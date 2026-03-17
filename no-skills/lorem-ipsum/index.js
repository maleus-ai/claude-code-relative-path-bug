const fs = require("fs");

const words = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
];

function generateSentence(minWords = 5, maxWords = 15) {
  const len = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const sentence = Array.from(
    { length: len },
    () => words[Math.floor(Math.random() * words.length)],
  );
  sentence[0] = sentence[0][0].toUpperCase() + sentence[0].slice(1);
  return sentence.join(" ") + ".";
}

function generateParagraph(minSentences = 3, maxSentences = 7) {
  const len =
    Math.floor(Math.random() * (maxSentences - minSentences + 1)) +
    minSentences;
  return Array.from({ length: len }, () => generateSentence()).join(" ");
}

function generateLoremIpsum(paragraphs = 3) {
  return Array.from({ length: paragraphs }, () => generateParagraph()).join(
    "\n\n",
  );
}

const count = parseInt(process.argv[2], 10) || 3;

fs.writeFileSync("./lorem-ipsum.txt", generateLoremIpsum(count));
