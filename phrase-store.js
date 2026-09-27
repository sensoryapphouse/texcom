// The user's phrase sets: one per language they use, each their own copy (edits, favourites, order).
//
// - Saved as localStorage "JsonTex_<language code>"; manifestInfo is the set in use (its .lang says which).
//   Switching language (language.js) saves the set in use and opens the one for the other language; nothing is
//   replaced. (Before 26 Sep 2026 there was one set, "JsonTex": it becomes the set for its own language.)
// - checkPhraseSet(data): is this a phrase set? Repairs small differences (tags stored as a list, missing fields).
// - saveToLocalStorage(): saves the set in use; says so if it couldn't (it used to fail silently when full).
// - Opening a phrase-set file keeps the set it replaces (Settings > Data > Restore previous phrases).
// - Phrases the user has edited or deleted are remembered in the set (userChanged), so updates never bring
//   them back or alter them.
// - In the apps each save also goes to a file per language in the app's own storage ("Backup:"), included in
//   the device's backups. If the page's storage is lost, TexCom restores every language from them at the next start.
(function () {
    const PREFIX = 'JsonTex_', PREVIOUS = 'JsonTexPrevious_', LEGACY = 'JsonTex';
    // Tags the English starter set used before 26 Sep 2026 for categories that never existed: phrases with only
    // these showed under "All" alone. Mapped to the categories they belong in (only where the set has that category).
    const OLD_TAGS = { 'Technology': 'Equipment', 'Environment': 'Request', 'Meals & Dining': 'Request', 'Emergency': 'Assistance' };

    function notify(kind, text, timeout) {
        if (typeof Notiflix !== 'undefined' && Notiflix.Notify) Notiflix.Notify[kind](t(text), { timeout: timeout || 8000 });
    }
    function toApp(message) {
        try {
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) window.webkit.messageHandlers.TexCom.postMessage({ m: message });
            else if (window.AndroidTexCom) window.AndroidTexCom.postMessage(JSON.stringify({ m: message }));
        } catch (e) {}
    }
    function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
    function tagsOf(c) {
        if (Array.isArray(c)) return c.map(t => String(t).replace(/^\[|\]$/g, '').trim()).filter(Boolean);
        return (String(c || '').match(/\[[^\]]+\]/g) || []).map(t => t.slice(1, -1));
    }
    const safeLang = code => String(code || 'en').replace(/[^A-Za-z0-9-]/g, '') || 'en';

    // Phrases compared ignoring case, spacing and final punctuation ("Thank you." = "thank you")
    window.normPhrase = function (s) { return (s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?。！？؟।]+$/, ''); };

    // Returns { set } (a repaired copy) or { error } (a sentence for the user)
    window.checkPhraseSet = function (data) {
        if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return { error: t('That file isn’t a TexCom phrase set (it isn’t readable).') }; } }
        if (!data || typeof data !== 'object' || !Array.isArray(data.categories) || !Array.isArray(data.messages))
            return { error: t('That file isn’t a TexCom phrase set.') };
        if (data.categories.length < 2) return { error: t('That phrase set has no categories.') };
        const set = JSON.parse(JSON.stringify(data));
        set.categories = set.categories.filter(c => c && String(c.name || '').trim()).map((c, i) => ({
            name: String(c.name).trim(), emoji: c.emoji || '▫️', colour: c.colour || '#000000',
            deletable: i < 2 ? false : c.deletable !== false, fixed: i < 2 ? true : !!c.fixed,
        }));
        const names = new Set(set.categories.map(c => c.name));
        set.messages = set.messages.filter(m => m && String(m.name || '').trim()).map(m => {
            let tags = tagsOf(m.categories);
            if (!m.userEdited) tags = tags.map(t => (!names.has(t) && OLD_TAGS[t] && names.has(OLD_TAGS[t])) ? OLD_TAGS[t] : t);
            tags = [...new Set(tags)];
            return Object.assign({}, m, {
                name: String(m.name), emoji: m.emoji || '', colour: m.colour || '#000000',
                deletable: m.deletable !== false, fixed: !!m.fixed, abbreviation: typeof m.abbreviation === 'string' ? m.abbreviation : ' ',
                instant: m.instant === true || m.instant === 'true', categories: tags.map(t => '[' + t + ']').join(''),
                gotaudio: !!m.gotaudio, audioData: m.audioData || '',
            });
        });
        if (!set.messages.length) return { error: t('That phrase set has no phrases.') };
        set.lang = safeLang(set.lang);
        set.userChanged = Array.isArray(set.userChanged) ? set.userChanged.filter(s => typeof s === 'string') : [];
        set.lastMessageId = set.messages.length;
        return { set };
    };

    // ---------- Saving ----------
    window.saveToLocalStorage = function () {
        if (typeof manifestInfo === 'undefined' || !manifestInfo) return false;
        const lang = safeLang(manifestInfo.lang), json = JSON.stringify(manifestInfo);
        try {
            localStorage.setItem(PREFIX + lang, json);
        } catch (e) {
            notify('failure', 'TexCom couldn’t save your phrases (the storage is full). Your last change may be lost when TexCom closes. Save your phrase set to a file in Settings > Data.', 12000);
            return false;
        }
        scheduleAppBackup(lang, json);
        return true;
    };

    // The app's copy (one file per language): a moment after the last change, so a run of edits is written once
    const backupTimers = {};
    function scheduleAppBackup(lang, json) {
        clearTimeout(backupTimers[lang]);
        backupTimers[lang] = setTimeout(() => toApp('Backup:' + lang + '\n' + json), 1500);
    }

    // ---------- Which sets exist ----------
    // Languages the user has phrases for (saved here, or only in the app's backup)
    window.savedLanguages = function () {
        const langs = new Set();
        try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) langs.add(k.slice(PREFIX.length)); } } catch (e) {}
        Object.keys(window.texcomAppBackups || {}).forEach(l => langs.add(l));
        return [...langs].filter(l => /^[A-Za-z0-9-]+$/.test(l));
    };

    // One language's set, checked: from this browser / app, or else from the app's backup copy. null if none.
    window.loadPhraseSet = function (lang) {
        lang = safeLang(lang);
        const raw = get(PREFIX + lang);
        if (raw) {
            const r = checkPhraseSet(raw);
            if (r.set) { r.set.lang = lang; return r.set; }
            try { localStorage.setItem(PREFIX + lang + 'Damaged', raw); localStorage.removeItem(PREFIX + lang); } catch (e) {} // set aside, not overwritten
        }
        const backup = (window.texcomAppBackups || {})[lang];
        if (backup) {
            const r = checkPhraseSet(backup);
            if (r.set) {
                r.set.lang = lang;
                try { localStorage.setItem(PREFIX + lang, JSON.stringify(r.set)); } catch (e) {}
                return r.set;
            }
        }
        return null;
    };

    // At start: move the old single set, and anything filed under the wrong language, to where it belongs; bring
    // back from the app's backups any language whose saved set is missing.
    function tidyStorage() {
        const legacy = get(LEGACY);
        if (legacy) {
            const r = checkPhraseSet(legacy);
            try {
                if (r.set && !get(PREFIX + r.set.lang)) localStorage.setItem(PREFIX + r.set.lang, JSON.stringify(r.set));
                localStorage.setItem(LEGACY + 'Migrated', legacy); // kept, just in case
                localStorage.removeItem(LEGACY);
            } catch (e) {}
        }
        // A set whose own language differs from its key (an interim version filed sets by the Language setting)
        savedLanguages().forEach(key => {
            const raw = get(PREFIX + key); if (!raw) return;
            const r = checkPhraseSet(raw);
            if (r.set && raw.includes('"lang"') && r.set.lang !== key) {
                try {
                    if (!get(PREFIX + r.set.lang)) localStorage.setItem(PREFIX + r.set.lang, raw);
                    localStorage.setItem('JsonTexMisfiled_' + key, raw);
                    localStorage.removeItem(PREFIX + key);
                } catch (e) {}
            }
        });
        let restored = 0;
        Object.keys(window.texcomAppBackups || {}).forEach(lang => {
            if (!get(PREFIX + lang) && loadPhraseSet(lang)) restored++;
        });
        if (restored) setTimeout(() => notify('info', 'Your phrases were restored from TexCom’s backup copy.'), 2500);
    }

    // The set to open at start: the one for the user's language, else any set they have (the language follows it)
    window.loadSavedPhrases = function (preferred) {
        tidyStorage();
        let set = loadPhraseSet(preferred);
        if (!set) {
            const other = savedLanguages().find(l => get(PREFIX + l) || (window.texcomAppBackups || {})[l]);
            if (other) set = loadPhraseSet(other);
        }
        if (set) scheduleAppBackup(set.lang, JSON.stringify(set)); // the app's copy is refreshed at every start
        return set;
    };

    // ---------- Replacing a set (opening a file) ----------
    window.hasPreviousPhrases = function () {
        return !!(typeof manifestInfo !== 'undefined' && manifestInfo && get(PREVIOUS + safeLang(manifestInfo.lang)));
    };
    // Put the kept set for this language back; the current one becomes the kept one, so this can be undone the same way
    window.restorePreviousPhrases = function () {
        const lang = safeLang(manifestInfo.lang), raw = get(PREVIOUS + lang);
        const r = raw ? checkPhraseSet(raw) : { error: t('There are no previous phrases to restore.') };
        if (!r.set) { notify('failure', r.error); return false; }
        try { localStorage.setItem(PREVIOUS + lang, JSON.stringify(manifestInfo)); } catch (e) {}
        r.set.lang = lang;
        usePhraseSet(r.set);
        notify('success', 'Your previous phrases are back. (The ones you were using are kept, so you can switch back the same way.)');
        return true;
    };
    // Make a set the one for its language, keeping that language's current set (if any) to restore
    window.replacePhraseSet = function (set) {
        const lang = safeLang(set.lang);
        const current = (typeof manifestInfo !== 'undefined' && manifestInfo && safeLang(manifestInfo.lang) === lang) ? JSON.stringify(manifestInfo) : get(PREFIX + lang);
        if (!current) { try { localStorage.removeItem(PREVIOUS + lang); } catch (e) {} }
        else {
            try { localStorage.setItem(PREVIOUS + lang, current); } catch (e) {
                notify('failure', 'There isn’t room to keep a copy of your current phrases, so they weren’t replaced. Save them to a file first (Settings > Data).', 12000);
                return false;
            }
        }
        if (typeof manifestInfo !== 'undefined' && manifestInfo && safeLang(manifestInfo.lang) !== lang) saveToLocalStorage(); // the set being left
        usePhraseSet(set);
        return true;
    };

    // Show a set (already checked) and save it as the set for its language; the language follows the set
    window.usePhraseSet = function (set) {
        manifestInfo = set;
        saveToLocalStorage();
        if (typeof params !== 'undefined' && params && params.language !== set.lang) { params.language = set.lang; if (typeof saveParams === 'function') saveParams(); }
        if (typeof processManifest === 'function') processManifest();
        categoryName = set.categories[0].name;
        if (typeof updateWithCategory === 'function') updateWithCategory();
        if (typeof afterListChange === 'function') afterListChange();
        if (typeof applyPhraseLanguage === 'function') applyPhraseLanguage();
        if (typeof setUpGUI === 'function' && document.getElementById('settingsContent')) setUpGUI();
    };

    // ---------- Phrases the user has changed ----------
    // The text a phrase had before the user edited or deleted it: TexCom never offers that phrase again
    window.rememberUserChange = function (originalText) {
        if (typeof manifestInfo === 'undefined' || !manifestInfo || !originalText) return;
        const key = normPhrase(originalText);
        if (!key) return;
        manifestInfo.userChanged = manifestInfo.userChanged || [];
        if (!manifestInfo.userChanged.includes(key)) manifestInfo.userChanged.push(key);
    };

    // Built-in categories by position: 0 is "All", 1 is "Favourites", whatever the set's language calls them
    window.allCategoryName = function () {
        return (typeof manifestInfo !== 'undefined' && manifestInfo && manifestInfo.categories[0] && manifestInfo.categories[0].name) || 'All';
    };
    window.favouritesTag = function () {
        return '[' + ((typeof manifestInfo !== 'undefined' && manifestInfo && manifestInfo.categories[1] && manifestInfo.categories[1].name) || 'Favourites') + ']';
    };
})();
