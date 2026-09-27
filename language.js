// Languages. Each language the user uses has its own phrase set (phrase-store.js); the language in use is the
// language of the phrases showing. It decides the voice, the language TexCom listens for, the language of the
// AI's suggestions, what Yes / No say, and the language of TexCom's own screens (t()).
//
// Switching language (Settings > General > Language) saves the phrases in
// use and opens the user's own set for the other language. The first time a language is chosen, TexCom offers its
// phrases in it: English is built in (TexCom.json); the others are fetched from
// texcom.pages.dev/languages/phrases/<code>.json (languages-list.js lists them).
(function () {
    const PUBLIC_BASE = 'https://texcom.pages.dev/'; // the web app's address (as in conversation.js)

    // ---------- TexCom's own text ----------
    // t('English text', { name: value }): the text in the current language (from locales/<code>.json, keyed by the
    // English), with {name} placeholders filled in. Anything not yet translated shows in English.
    let uiText = {}, uiCode = 'en';
    // Did a fetch work? In the apps the pages are files (file://), where a file that was read has status 0, not 200
    window.fetchWorked = r => r.ok || (r.status === 0 && location.protocol === 'file:');
    const fill = (s, vars) => vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)) : s;
    window.t = function (s, vars) { return fill((uiText && uiText[s]) || s, vars); };
    async function fetchUIText(code) {
        if (!code || code === 'en') return {};
        try {
            const r = await fetch('locales/' + encodeURIComponent(code) + '.json');
            if (fetchWorked(r)) return (await r.json()).ui || {};
        } catch (e) {}
        return {};
    }
    // Load a language's text; the old text stays until the new has arrived. uiTextReady: when it's in place.
    window.uiTextReady = Promise.resolve();
    window.loadUIText = function (code) {
        return (window.uiTextReady = fetchUIText(code).then(dict => { uiText = dict; uiCode = code || 'en'; applyUIText(); }));
    };

    // A language's name in the language on screen ("arabe" in French, "Arabisch" in German), from the browser's
    // own list; the English name where it doesn't know one. A browser without names in the language on screen
    // quietly gives English ones ("Central Kurdish" inside Kurdish), so the list's own language is checked.
    window.languageName = function (code, inLanguage) {
        const lang = texcomLanguage(code), ui = inLanguage || uiCode;
        try {
            const names = new Intl.DisplayNames([ui], { type: 'language', fallback: 'none' });
            const name = names.of(code);
            if (name && name.toLowerCase() !== code.toLowerCase() && sameLanguage(names.resolvedOptions().locale, ui)) return name;
        } catch (e) {}
        return ui === code ? lang.native : lang.english;
    };

    const sameLanguage = (a, b) => String(a).split('-')[0].toLowerCase() === String(b).split('-')[0].toLowerCase();

    // The page's fixed text: elements marked data-t (their text) and data-t-attrs="title aria-label placeholder".
    // The English is remembered the first time, so switching language again translates from the English.
    // Then 'texcom-ui-text' tells the scripts to redo the text they set themselves (Settings, toolbar states…).
    window.applyUIText = function (root) {
        (root || document).querySelectorAll('[data-t]').forEach(el => {
            if (el.__tEn === undefined) el.__tEn = el.textContent;
            el.textContent = t(el.__tEn);
        });
        (root || document).querySelectorAll('[data-t-attrs]').forEach(el => {
            el.__tEnAttrs = el.__tEnAttrs || {};
            el.getAttribute('data-t-attrs').split(/\s+/).filter(Boolean).forEach(a => {
                if (el.__tEnAttrs[a] === undefined) el.__tEnAttrs[a] = el.getAttribute(a) || '';
                el.setAttribute(a, t(el.__tEnAttrs[a]));
            });
        });
        if (!root) window.dispatchEvent(new Event('texcom-ui-text'));
    };

    window.currentLanguage = function () {
        if (typeof manifestInfo !== 'undefined' && manifestInfo && manifestInfo.lang) return manifestInfo.lang;
        return (typeof params !== 'undefined' && params && params.language) || 'en';
    };

    function phraseSetURL(code) {
        if (code === 'en') return 'TexCom.json';
        // Now fully offline and bundled locally in the manifests folder
        return 'manifests/' + encodeURIComponent(code) + '.json';
    }
    window.fetchLanguagePhrases = async function (code) {
        const r = await fetch(phraseSetURL(code), { cache: 'no-cache' });
        if (!fetchWorked(r)) throw new Error('HTTP ' + r.status);
        return r.json();
    };

    function toApp(message) {
        try {
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) window.webkit.messageHandlers.TexCom.postMessage({ m: message });
            else if (window.AndroidTexCom) window.AndroidTexCom.postMessage(JSON.stringify({ m: message }));
        } catch (e) {}
    }
    function notify(kind, text, timeout) {
        if (typeof Notiflix !== 'undefined' && Notiflix.Notify) Notiflix.Notify[kind](text, { timeout: timeout || 8000 });
    }

    // ---------- Voice ----------
    // Does a voice's language ("fr-FR", "zh-TW", "nb-NO") belong to one of TexCom's language codes?
    const VOICE_LANGS = { 'zh-Hans': ['zh-cn', 'zh-sg', 'cmn'], 'zh-Hant': ['zh-tw', 'zh-hk'], 'no': ['nb', 'no', 'nn'], 'he': ['he', 'iw'], 'fil': ['fil', 'tl'] };
    function voiceMatches(voiceLang, code) {
        const v = String(voiceLang || '').toLowerCase().replace('_', '-');
        const wanted = VOICE_LANGS[code] || [code.toLowerCase()];
        return wanted.some(w => v === w || v.startsWith(w + '-'));
    }
    function voiceList() {
        if (typeof webViewIOS !== 'undefined' && webViewIOS && typeof IOSnames !== 'undefined' && IOSnames) return IOSnames.split(',');
        if (typeof doingSAPI !== 'undefined' && doingSAPI && typeof SAPInames !== 'undefined' && SAPInames) return SAPInames.split(',');
        if ('speechSynthesis' in window) return speechSynthesis.getVoices().map(v => v.name + ': ' + v.lang);
        return [];
    }
    // The voice for a language: the one last chosen for it, else the chosen voice if it speaks it, else the first
    // voice that does. Each language remembers its own voice (params.voices), so switching back restores it.
    function chooseVoiceFor(code) {
        params.voices = params.voices || {};
        const list = voiceList();
        const remembered = params.voices[code];
        const current = (params.currentVoice || '').split(': ')[1];
        let pick = null;
        if (remembered && (!list.length || list.includes(remembered))) pick = remembered;
        else if (current && voiceMatches(current, code)) pick = params.currentVoice;
        else pick = list.find(v => voiceMatches(v.split(': ')[1], code)) || null;
        if (!pick) {
            if (list.length) notify('info', t('There’s no {language} voice on this device, so TexCom will read with the voice it has. You can add voices in the device’s settings (Accessibility > Spoken Content or Speech).', { language: languageName(code) }), 12000);
            return;
        }
        params.currentVoice = pick;
        params.voices[code] = pick;
        if (typeof saveParams === 'function') saveParams();
        if (typeof changeVoice === 'function') changeVoice(pick);
    }
    window.rememberVoiceForLanguage = function (voice) { // Settings > Voice: this language's voice from now on
        params.voices = params.voices || {};
        params.voices[currentLanguage()] = voice;
    };

    // ---------- Applying a language ----------
    // Tell the page and the app which language is in use (at start, and after a switch)
    window.applyPhraseLanguage = function () {
        const code = currentLanguage();
        const lang = texcomLanguage(code);
        document.documentElement.lang = code;
        document.documentElement.dir = lang.dir || 'ltr';
        toApp('Language:' + code); // the app listens in this language
        return loadUIText(code);
    };

    // Switch to another language: the user's own phrases for it, or (the first time) TexCom's, if they want them.
    // Returns true if the language changed.
    window.setLanguage = async function (code, firstRun) {
        const lang = texcomLanguage(code);
        if (typeof manifestInfo !== 'undefined' && manifestInfo && manifestInfo.lang === lang.code) return true;
        let set = loadPhraseSet(lang.code);
        if (!set) {
            try {
                const r = checkPhraseSet(await fetchLanguagePhrases(lang.code));
                if (!r.set) throw new Error(r.error);
                set = r.set;
                set.lang = lang.code;
            } catch (e) {
                if (!firstRun) notify('failure', t('TexCom couldn’t get the {language} phrases. They need an internet connection the first time.', { language: languageName(lang.code) }), 10000);
                return false;
            }
            // On first start the question is asked in the language offered (whoever reads it speaks that one);
            // otherwise in the language on screen
            let tt = t, name = c => languageName(c);
            if (firstRun) {
                const dict = await fetchUIText(lang.code);
                tt = (s, vars) => fill(dict[s] || s, vars);
                name = c => languageName(c, lang.code);
            }
            const checked = lang.code === 'en' ? '' : ' ' + tt('They were translated by machine and haven’t yet been checked by a {language} speaker.', { language: name(lang.code) });
            const here = (typeof manifestInfo !== 'undefined' && manifestInfo) ? manifestInfo.lang : 'en';
            const yes = await askConfirm({
                title: tt('TexCom in {language}?', { language: name(lang.code) }),
                message: tt('TexCom has {n} phrases in {language}.', { n: set.messages.length, language: name(lang.code) }) + checked + ' '
                    + (firstRun ? tt('Use them instead of the English ones?') : tt('They become your {language} phrases, to change as you like. Your {current} phrases stay as they are: switch back any time.', { language: name(lang.code), current: name(here) })),
                ok: tt('Use {language}', { language: name(lang.code) }), cancel: firstRun ? tt('Keep English') : tt('Cancel'),
            });
            if (!yes) return false;
        }
        if (!firstRun && typeof manifestInfo !== 'undefined' && manifestInfo) saveToLocalStorage(); // the phrases being left
        usePhraseSet(set);            // shows them, saves them as this language's set, and sets params.language
        await window.uiTextReady;     // TexCom's own text in the new language first
        chooseVoiceFor(lang.code);
        if (typeof checkForNewPhrases === 'function') setTimeout(checkForNewPhrases, 1500);
        notify('success', t('TexCom is using your {language} phrases.', { language: languageName(lang.code) }));
        return true;
    };

    // The device's (browser's) language as one of TexCom's codes, or 'en' if TexCom doesn't have it
    window.deviceLanguageCode = function () {
        for (const device of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])) {
            let code = device.split('-')[0].toLowerCase();
            if (code === 'zh') code = /hant|tw|hk|mo/i.test(device) ? 'zh-Hant' : 'zh-Hans';
            if (code === 'nb' || code === 'nn') code = 'no';
            if (code === 'iw') code = 'he';
            if (code === 'tl') code = 'fil';
            if (TEXCOM_LANGUAGES.some(l => l.code === code)) return code;
        }
        return 'en';
    };

    // First start (no saved phrases yet): if the device's language has TexCom phrases, offer them
    window.offerDeviceLanguage = function () {
        const code = deviceLanguageCode();
        if (code !== 'en') setTimeout(() => setLanguage(code, true), 1500);
    };

    // The words the Yes and No buttons say
    window.yesWord = function () { return texcomLanguage(currentLanguage()).yes; };
    window.noWord = function () { return texcomLanguage(currentLanguage()).no; };

})();

// Called by the app when the device can't listen in the chosen language
window.listeningLanguageUnavailable = function (code) {
    if (typeof Notiflix !== 'undefined' && Notiflix.Notify)
        Notiflix.Notify.info(t('This device can’t listen in {language}, so the microphone listens in the previous language.', { language: languageName(code) }), { timeout: 10000 });
};
