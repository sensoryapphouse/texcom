import {
    createPopup
} from './index.js';

// The emoji picker, in the language in use: its own labels through t() (language.js), and the emoji names it shows
// and searches from Emojibase (emojibase/<code>/, which has 25 of TexCom's languages; the others use English names).
// It's made in advance (the editor shows its anchor only for the moment of the click) and again after a language change.
const EMOJI_NAMES = { 'no': 'nb', 'zh-Hans': 'zh', 'zh-Hant': 'zh-hant' };
const EMOJIBASE = ['bn', 'da', 'de', 'es', 'et', 'fi', 'fr', 'hi', 'hu', 'it', 'ja', 'ko', 'lt', 'ms', 'nb', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'uk', 'vi', 'zh', 'zh-hant'];
function emojiLocale(code) {
    const c = EMOJI_NAMES[code] || code;
    return EMOJIBASE.includes(c) ? c : 'en';
}
function pickerText() {
    return {
        'categories.activities': t('Activities'),
        'categories.animals-nature': t('Animals & Nature'),
        'categories.flags': t('Flags'),
        'categories.food-drink': t('Food & Drink'),
        'categories.objects': t('Objects'),
        'categories.people-body': t('People & Body'),
        'categories.recents': t('Recently Used'),
        'categories.smileys-emotion': t('Smileys & Emotion'),
        'categories.symbols': t('Symbols'),
        'categories.travel-places': t('Travel & Places'),
        'error.load': t('Couldn’t load the emojis.'),
        'recents.clear': t('Clear recent emojis'),
        'recents.none': t('No emojis chosen yet.'),
        'retry': t('Try again'),
        'search.clear': t('Clear search'),
        'search.error': t('Couldn’t search the emojis.'),
        'search.notFound': t('No emojis found'),
        'search': t('Search emojis…'),
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.querySelector('#trigger');
    if (!trigger) return;
    let picker = null, pickerLanguage = null, pickerColumns = 0;

    function getPicker() {
        const language = typeof currentLanguage === 'function' ? currentLanguage() : 'en';
        const columns = Math.max(5, Math.min(8, Math.floor((window.innerWidth - 60) / 48))); // fits a phone's width
        if (picker && pickerLanguage === language && pickerColumns === columns) return picker;
        // (destroy() throws for a picker that was never opened; it's only thrown away)
        if (picker) { const old = picker; Promise.resolve().then(() => old.destroy()).catch(() => {}); }
        picker = createPopup({
            showSearch: true,
            showCategoryTabs: true,
            showPreview: false,
            emojisPerRow: columns,
            locale: emojiLocale(language),
            i18n: pickerText(),
        }, {
            referenceElement: trigger,
            triggerElement: trigger,
            position: 'bottom-start', // below its anchor, from the anchor's left edge (centred, it ran off a phone's screen)
        });
        picker.addEventListener('emoji:select', (selection) => {
            itemChanged = true;
            if (btnEmoji.tagName === 'INPUT') btnEmoji.value = selection.emoji; // item editor's Symbol field
            else btnEmoji.innerHTML = selection.emoji;
        });
        pickerLanguage = language;
        pickerColumns = columns;
        return picker;
    }

    getPicker();
    window.addEventListener('texcom-ui-text', getPicker); // TexCom's text is now in the language in use
    // The phrase editor: the picker opens below the Symbol field (under), from its Choose… button (button: a click on
    // it doesn't count as a click outside)
    window.openEmojiPicker = function (button, under) {
        getPicker().open({ triggerElement: button, referenceElement: under || button });
    };
    trigger.addEventListener('click', () => {
        getPicker().toggle();
    });
});
