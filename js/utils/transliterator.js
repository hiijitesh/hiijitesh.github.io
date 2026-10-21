/**
 * Hinglish to Hindi Transliterator Utility
 * Converts Romanized Hindi (Hinglish) into authentic Devanagari Hindi script.
 * Dual Engine:
 * 1. Online Google Input Tools API for 99.9% grammar & contextual accuracy.
 * 2. Instant offline rule-based & phonetic dictionary fallback for zero-network environments.
 */

window.App = window.App || {};

(function(App) {

  // In-memory cache to prevent redundant conversions
  const translationCache = new Map();

  // Curated common vocabulary dictionary for instant offline accuracy
  const COMMON_DICTIONARY = {
    "aur": "और",
    "bhai": "भाई",
    "sab": "सब",
    "badhiya": "बढ़िया",
    "batao": "बताओ",
    "kya": "क्या",
    "dhoondh": "ढूंढ",
    "rahe": "रहे",
    "ho": "हो",
    "meri": "मेरी",
    "mera": "मेरा",
    "mere": "मेरे",
    "poetry": "कविता",
    "padhoge": "पढ़ोगे",
    "ya": "या",
    "show": "शो",
    "ka": "का",
    "ki": "की",
    "ke": "के",
    "ko": "को",
    "se": "से",
    "me": "में",
    "mein": "में",
    "pe": "पे",
    "par": "पर",
    "tix": "टिकट",
    "chahiye": "चाहिए",
    "kalam": "कलम",
    "thoda": "थोड़ा",
    "likha": "लिखा",
    "tha": "था",
    "thi": "थी",
    "the": "थे",
    "padh": "पढ़",
    "lo": "लो",
    "dil": "दिल",
    "screen": "स्क्रीन",
    "utar": "उतार",
    "diya": "दिया",
    "kisi": "किसी",
    "bhi": "भी",
    "piece": "रचना",
    "click": "क्लिक",
    "sukoon": "सुकून",
    "padho": "पढ़ो",
    "tour": "दौरा",
    "live": "लाइव",
    "baithak": "बैठक",
    "agli": "अगली",
    "tayyari": "तैयारी",
    "chal": "चल",
    "rahi": "रही",
    "hai": "है",
    "hain": "हैं",
    "shehar": "शहर",
    "ghoom": "घूम",
    "mehfil": "महफ़िल",
    "jamane": "जमाने",
    "wale": "वाले",
    "nayi": "नई",
    "dates": "तारीखें",
    "plan": "प्लान",
    "sabse": "सबसे",
    "pehle": "पहले",
    "pata": "पता",
    "karna": "करना",
    "toh": "तो",
    "apna": "अपना",
    "apne": "अपने",
    "apni": "अपनी",
    "email": "ईमेल",
    "chhod": "छोड़",
    "do": "दो",
    "tumhare": "तुम्हारे",
    "kab": "कब",
    "aana": "आना",
    "daal": "डाल",
    "yahan": "यहाँ",
    "jaise": "जैसे",
    "hi": "ही",
    "final": "फाइनल",
    "honge": "होंगे",
    "tumko": "तुमको",
    "bataunga": "बताऊँगा",
    "ek": "एक",
    "samay": "समय",
    "jahan": "जहाँ",
    "kuch": "कुछ",
    "kuchh": "कुछ",
    "naa": "ना",
    "na": "ना",
    "paane": "पाने",
    "bhay": "भय",
    "aaj": "आज",
    "waqt": "वक़्त",
    "hoke": "होके",
    "jindgi": "जिंदगी",
    "zindagi": "ज़िंदगी",
    "lagti": "लगती",
    "kamwaqt": "कमबख्त",
    "paya": "पाया",
    "khoya": "खोया",
    "hu": "हूँ",
    "hun": "हूँ",
    "hoon": "हूँ",
    "jab": "जब",
    "tab": "तब",
    "roya": "रोया",
    "sapne": "सपने",
    "dekhe": "देखे",
    "bade": "बड़े",
    "udaan": "उड़ान",
    "par": "पर",
    "main": "मैं",
    "yunhi": "यूँही",
    "soya": "सोया",
    "hota": "होता",
    "agar": "अगर",
    "khona": "खोने",
    "soch": "सोच",
    "pare": "परे",
    "hona": "होना",
    "sambhaal": "संभाल",
    "rakhata": "रखता",
    "uss": "उस",
    "us": "उस",
    "pal": "पल",
    "jo": "जो",
    "khaas": "ख़ास",
    "isko": "इसको",
    "din": "दिन",
    "khayaal": "ख़याल",
    "khayal": "ख़याल",
    "aise": "ऐसे",
    "meet": "मिट",
    "patein": "पाते",
    "shaam": "शाम",
    "aisi": "ऐसी",
    "dhal": "ढल",
    "log": "लोग",
    "charo": "चारों",
    "taraf": "तरफ",
    "lekin": "लेकिन",
    "fir": "फिर",
    "phir": "फिर",
    "hum": "हम",
    "ghool": "घुल",
    "meel": "मिल",
    "bahar": "बाहर",
    "bheed": "भीड़",
    "nazaraa": "नज़ारा",
    "nazara": "नज़ारा",
    "under": "अंदर",
    "andar": "अंदर",
    "jhanka": "झाँका",
    "sukha": "सूखा",
    "kinaara": "किनारा",
    "kabhi": "कभी",
    "aarzoo": "आरज़ू",
    "apno": "अपनों",
    "lagta": "लगता",
    "thik": "ठीक",
    "theek": "ठीक",
    "jayegaa": "जाएगा",
    "jayega": "जाएगा",
    "ye": "ये",
    "yeh": "यह",
    "woh": "वह",
    "wo": "वो",
    "batayega": "बताएगा",
    "tanha": "तन्हा",
    "kat": "कट",
    "hazaar": "हज़ार",
    "bahut": "बहुत",
    "besoomar": "बेशुमार",
    "pana": "पाना",
    "bekaraar": "बेकरार",
    "anshu": "आँसू",
    "aankhon": "आँखों",
    "ankho": "आँखों",
    "aukaat": "औकात",
    "sochata": "सोचता",
    "ro": "रो",
    "lu": "लूँ",
    "jee": "जी",
    "bhar": "भर",
    "itna": "इतना",
    "aashaan": "आसान",
    "aasan": "आसान",
    "kahan": "कहाँ",
    "kahani": "कहानी",
    "ab": "अब",
    "pahale": "पहले",
    "wali": "वाली",
    "baat": "बात",
    "sahi": "सही",
    "phone": "फ़ोन",
    "hotii": "होती",
    "hoti": "होती",
    "koi": "कोई",
    "mulakaat": "मुलाक़ात",
    "jazbaat": "जज़्बात",
    "jeevan": "जीवन",
    "raas": "रास",
    "pta": "पता",
    "raat": "रात",
    "ehsaas": "एहसास",
    "saath": "साथ",
    "katega": "कटेगा",
    "bin": "बिन",
    "magar": "मगर",
    "sach": "सच",
    "sadiyo": "सदियों",
    "sa": "सा",
    "lagega": "लगेगा",
    "lagea": "लगेगा",
    "janam": "जनम",
    "aadat": "आदत",
    "ban": "बन",
    "gayi": "गई",
    "jisko": "जिसको",
    "gum": "ग़म",
    "khushi": "ख़ुशी",
    "jeev": "जीव",
    "jantu": "जंतु",
    "dhudhata": "ढूँढता",
    "dhoondhta": "ढूँढता",
    "guzaara": "गुज़ारा",
    "sahaaraa": "सहारा",
    "sahara": "सहारा",
    "likhana": "लिखना",
    "chahatu": "चाहता",
    "chahata": "चाहता",
    "baare": "बारे",
    "keh": "कह",
    "tumhe": "तुम्हें",
    "dundha": "ढूँढा",
    "chand": "चाँद",
    "sitaaro": "सितारों",
    "chhoti": "छोटी",
    "si": "सी",
    "aarzu": "आरज़ू",
    "hamesha": "हमेशा",
    "raho": "रहो",
    "baaho": "बाहों",
    "kalaa": "कला",
    "kami": "कमी",
    "nahi": "नहीं",
    "shayri": "शायरी",
    "kitaab": "किताब",
    "dekh": "देख",
    "bhool": "भूल",
    "jata": "जाता",
    "kuchh": "कुछ",
    "iss": "इस",
    "is": "इस",
    "tarah": "तरह",
    "pyaar": "प्यार",
    "pyar": "प्यार",
    "hua": "हुआ",
    "aap": "आप",
    "se": "से",
    "janbab": "जनाब",
    "janab": "जनाब",
    "kavi": "कवि",
    "shayar": "शायर"
  };

  /**
   * Offline Rule-based transliterator for unknown words
   */
  function phoneticWordConvert(word) {
    if (!word) return '';
    const lower = word.toLowerCase();

    // Check dictionary
    if (COMMON_DICTIONARY[lower]) {
      return COMMON_DICTIONARY[lower];
    }

    // Preserve numbers or punctuation
    if (/^[0-9.,!?;:'"()\-]+$/.test(word)) {
      return word;
    }

    // Basic transliteration engine for unlisted words
    const vowels = {
      'aa': 'ा', 'a': '', 'ee': 'ी', 'i': 'ि', 'oo': 'ू', 'u': 'ु',
      'ai': 'ै', 'e': 'े', 'au': 'ौ', 'o': 'ो'
    };

    const initialVowels = {
      'aa': 'आ', 'a': 'अ', 'ee': 'ई', 'i': 'इ', 'oo': 'ऊ', 'u': 'उ',
      'ai': 'ऐ', 'e': 'ए', 'au': 'औ', 'o': 'ओ'
    };

    const consonants = {
      'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ',
      'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ',
      't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
      'p': 'प', 'ph': 'फ', 'f': 'फ़', 'b': 'ब', 'bh': 'भ', 'm': 'म',
      'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
      'sh': 'श', 'shh': 'ष', 's': 'स', 'h': 'ह',
      'z': 'ज़', 'q': 'क़', 'x': 'क्स'
    };

    let result = '';
    let i = 0;
    let isInitial = true;

    while (i < lower.length) {
      // Check 3-char match
      const three = lower.slice(i, i + 3);
      // Check 2-char match
      const two = lower.slice(i, i + 2);
      const one = lower.slice(i, i + 1);

      if (isInitial && (initialVowels[two] || initialVowels[one])) {
        if (initialVowels[two]) {
          result += initialVowels[two];
          i += 2;
        } else {
          result += initialVowels[one];
          i += 1;
        }
        isInitial = false;
        continue;
      }

      if (consonants[two]) {
        result += consonants[two];
        i += 2;
        isInitial = false;
        // Check following vowel
        const nextTwo = lower.slice(i, i + 2);
        const nextOne = lower.slice(i, i + 1);
        if (vowels[nextTwo]) {
          result += vowels[nextTwo];
          i += 2;
        } else if (vowels[nextOne] !== undefined) {
          result += vowels[nextOne];
          i += 1;
        } else if (i < lower.length && consonants[lower.slice(i, i + 1)]) {
          result += '्'; // halant for conjunct
        }
        continue;
      }

      if (consonants[one]) {
        result += consonants[one];
        i += 1;
        isInitial = false;
        // Check following vowel
        const nextTwo = lower.slice(i, i + 2);
        const nextOne = lower.slice(i, i + 1);
        if (vowels[nextTwo]) {
          result += vowels[nextTwo];
          i += 2;
        } else if (vowels[nextOne] !== undefined) {
          result += vowels[nextOne];
          i += 1;
        } else if (i < lower.length && consonants[lower.slice(i, i + 1)]) {
          result += '्'; // halant for conjunct
        }
        continue;
      }

      // Fallback
      result += one;
      i += 1;
      isInitial = false;
    }

    return result || word;
  }

  /**
   * Synchronous offline transliteration function
   * @param {string} text - Hinglish text
   * @returns {string} - Devanagari Hindi text
   */
  function hinglishToHindiSync(text) {
    if (!text || typeof text !== 'string') return '';
    return text.split('\n').map(line => {
      return line.split(' ').map(word => {
        // Strip trailing punctuation
        const match = word.match(/^([a-zA-Z0-9]+)([^a-zA-Z0-9]*)$/);
        if (match) {
          const converted = phoneticWordConvert(match[1]);
          return converted + match[2];
        }
        return phoneticWordConvert(word);
      }).join(' ');
    }).join('\n');
  }

  /**
   * Asynchronous high-precision transliteration function
   * Uses Google Input Tools API with intelligent fallback to local engine
   * @param {string} text - Hinglish text
   * @returns {Promise<string>} - Devanagari Hindi text
   */
  async function hinglishToHindi(text) {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return text;

    // Check cache
    if (translationCache.has(trimmed)) {
      return translationCache.get(trimmed);
    }

    // Try online high-accuracy transliteration API
    try {
      // Split into paragraphs/lines to avoid exceeding URL lengths
      const lines = text.split('\n');
      const translatedLines = await Promise.all(lines.map(async (line) => {
        const lineTrim = line.trim();
        if (!lineTrim) return line;

        // Check cache for individual line
        if (translationCache.has(lineTrim)) {
          return translationCache.get(lineTrim);
        }

        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(lineTrim)}&itc=hi-t-i0-und&num=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API error');
        const json = await res.json();

        if (json && json[0] === 'SUCCESS' && json[1] && json[1][0] && json[1][0][1] && json[1][0][1][0]) {
          const result = json[1][0][1][0];
          translationCache.set(lineTrim, result);
          return result;
        }

        return hinglishToHindiSync(line);
      }));

      const finalResult = translatedLines.join('\n');
      translationCache.set(trimmed, finalResult);
      return finalResult;
    } catch {
      // Offline fallback
      const fallback = hinglishToHindiSync(text);
      translationCache.set(trimmed, fallback);
      return fallback;
    }
  }

  // Expose on App and window
  App.hinglishToHindi = hinglishToHindi;
  App.hinglishToHindiSync = hinglishToHindiSync;
  window.hinglishToHindi = hinglishToHindi;
  window.hinglishToHindiSync = hinglishToHindiSync;

})(window.App);
