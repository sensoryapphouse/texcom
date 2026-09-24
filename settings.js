
function getBestEmoji(text, categoryName) {
    let lower = text.toLowerCase();
    let wordToEmoji = {
        "hello": "👋", "hi": "👋", "goodbye": "👋", "bye": "👋",
        "yes": "✅", "no": "❌", "maybe": "🤷", "ok": "👍", "okay": "👍",
        "thanks": "🙏", "thank you": "🙏", "please": "🥺", "sorry": "😔",
        "good": "👍", "bad": "👎", "love": "❤️", "hate": "💔",
        "happy": "😊", "sad": "😢", "angry": "😠", "laugh": "😂",
        "help": "🆘", "stop": "🛑", "go": "🟢", "wait": "✋",
        "home": "🏠", "family": "👨‍👩‍👧‍👦", "time": "⏰", "eat": "🍽️", "drink": "🥤"
    };
    for(let word in wordToEmoji) {
        if(lower.includes(word)) return wordToEmoji[word];
    }
    if(categoryName && typeof manifestInfo !== 'undefined') {
        let cleanCat = categoryName.replace(/[\[\]]/g, '');
        let catObj = manifestInfo.categories.find(c => c.name === cleanCat);
        if(catObj && catObj.emoji && catObj.emoji !== "▫️") return catObj.emoji;
    }
    return "💬";
}

// On-device AI runs only inside the TexCom apps (iPhone / iPad / Mac, Android), never in a web browser
window.deviceSupportsAI = !!((typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers) || window.AndroidTexCom);
var jsonString;
var smallPortrait = false;
var switchInput = "Press"; // save "Press", "Release" or "Hover" for params.selectWith and params.selectWithSwitchScan (later is for scanning and Cursor Keys/Dpad)

// A yes/no question in TexCom's own dialog: real buttons (Notiflix used links, which screen readers announce
// as links, with a green "Delete" and small text), the app's theme, Escape or a tap outside to cancel.
// askConfirm({ title, message, ok, cancel, danger }) -> Promise<boolean>
window.askConfirm = function (opts) {
    const o = document.getElementById('askOverlay');
    if (!o) return Promise.resolve(window.confirm(opts.message));
    const okBtn = document.getElementById('askOk'), cancelBtn = document.getElementById('askCancel');
    document.getElementById('askTitle').textContent = opts.title || '';
    document.getElementById('askMessage').textContent = opts.message || '';
    okBtn.textContent = opts.ok || 'OK';
    cancelBtn.textContent = opts.cancel || 'Cancel';
    okBtn.classList.toggle('danger', !!opts.danger);
    okBtn.classList.toggle('primary', !opts.danger);
    const returnFocus = document.activeElement;
    o.hidden = false;
    setTimeout(() => (opts.danger ? cancelBtn : okBtn).focus(), 50); // a risky action starts on the safe button
    return new Promise(resolve => {
        const done = (answer) => {
            o.hidden = true;
            okBtn.onclick = cancelBtn.onclick = o.onclick = null;
            document.removeEventListener('keydown', onKey, true);
            if (returnFocus && typeof returnFocus.focus === 'function' && document.contains(returnFocus)) returnFocus.focus();
            resolve(answer);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); done(false); }
            else if (e.key === 'Tab') { // keep focus inside the dialog
                const first = cancelBtn, last = okBtn;
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        okBtn.onclick = () => done(true);
        cancelBtn.onclick = () => done(false);
        o.onclick = (e) => { if (e.target === o) done(false); };
        document.addEventListener('keydown', onKey, true);
    });
};

// Notices (Notiflix.Notify): in front of everything, centred just below the toolbar so they never hide it,
// large text, and colours with at least 4.5:1 contrast (the library's defaults were about 2.3:1)
function initNotices() {
    if (typeof Notiflix === 'undefined' || !Notiflix.Notify) return;
    const bar = document.getElementById('topToolbar');
    const below = bar ? Math.round(bar.getBoundingClientRect().bottom) + 8 : 70;
    document.documentElement.style.setProperty('--notice-top', below + 'px'); // used by the style.css rule that places them
    Notiflix.Notify.init({
        position: 'center-top', distance: '0px', zindex: 20000,
        width: Math.min(420, window.innerWidth - 32) + 'px', fontSize: '18px', // a plain px width: Notiflix can't centre a min() borderRadius: '10px',
        fontFamily: 'inherit', cssAnimationStyle: 'fade', clickToClose: true, timeout: 6000,
        success: { background: '#166534', textColor: '#ffffff', notiflixIconColor: 'rgba(255,255,255,0.9)' },
        failure: { background: '#b91c1c', textColor: '#ffffff', notiflixIconColor: 'rgba(255,255,255,0.9)' },
        info:    { background: '#1d4ed8', textColor: '#ffffff', notiflixIconColor: 'rgba(255,255,255,0.9)' },
        warning: { background: '#fde68a', textColor: '#1f2937', notiflixIconColor: 'rgba(31,41,55,0.8)' },
    });
}
document.addEventListener('DOMContentLoaded', () => {
    initNotices();
    const bar = document.getElementById('topToolbar'); // follow the toolbar as it lays out and resizes
    if (bar && 'ResizeObserver' in window) new ResizeObserver(initNotices).observe(bar);
});
window.addEventListener('resize', initNotices);

Notiflix.Confirm.init({
    className: 'notiflix-confirm',
    width: '300px',
    zindex: 19003,
    position: 'center',
    distance: '10px',
    backgroundColor: '#f8f8f8', //'#f8f8f8',
    borderRadius: '25px',
    backOverlay: true,
    backOverlayColor: 'rgba(0,0,0,0.5)',
    rtl: false,
    fontFamily: 'Quicksand',
    cssAnimation: true,
    cssAnimationDuration: 300,
    cssAnimationStyle: 'fade',
    plainText: true,
    titleColor: 'black', // #32c682',
    titleFontSize: '24px', //'16px',
    titleMaxLength: 34,
    messageColor: '#1e1e1e',
    messageFontSize: '14px',
    messageMaxLength: 110,
    buttonsFontSize: '15px',
    buttonsMaxLength: 34,
    okButtonColor: '#f8f8f8',
    okButtonBackground: '#32c682',
    cancelButtonColor: '#f8f8f8',
    cancelButtonBackground: '#a9a9a9',
});
var defaultParams = {
    UserName: "",
    Theme: "theme-modern",
    currentVoice: 'Fiona: en',
    voiceRate: 1,
    voicePitch: 1,
    voiceVolume: 1,
    tooltips: false,
    chatInterface: false,
    readPartnerAloud: false, // conversations: speak the partner's messages
    llmExpansion: true,
    ambientListening: false,
    peerId: "",
    userPersona: "",
    personaTone: "Friendly",
    personaFormality: "Casual",
    personaPronouns: "Not Specified",
    personaDisability: "Prefer not to say",
    personaDisclosure: "Private (Do not mention)",
    personaHearing: "Not Specified",
    /* Import text file
    Import communicator
    Export communicator
    Share
    Language
    */

    /*
    boardName: "quick-core-24.obz",
    boardStyle: 'ToolbarBottom', // 0: no toolbar. 1: gap at top. 2: gap at bottom.
    toolbarSize: 'medium',
    textPos: 'top', // 0: text at top. 1: text at bottom. 2: no text
    buttonSpacing: 'medium',
    backgroundColour: 'rgb(180,222,222)',
    highlightColour: 'rgb(255,255,0)',
    highContrast: false,
    inputMethod: 'Touch/Mouse',
    allowZoom: true,
    selectWith: 'Release',
    selectWithSwitchScan: 'Press',
    acceptanceDelay: 0.0,
    acceptanceDelayHover: 1.0,
    touchpadMode: 'Absolute',
    touchpadSize: 3,
    mouseWheel: "Row/Column",
    switchStyle: 'Two switch step',
    speed: 1.0, // on press, on release, on hold for time, no short presses
    vocaliseEachButton: true,
    vocaliseLinkButtons: true,
    autoReturnToHome: false,
    backgroundImage: null,
    buttonEditor: false,
    chkHideSettings: true
    */
};
// Always work on a copy: resetting must bring back the real defaults, not ones changed since
function freshDefaults() { return JSON.parse(JSON.stringify(defaultParams)); }
var params = freshDefaults();

async function saveParams() {
    try {
        window.localStorage.setItem("TexCom", JSON.stringify(params));
    } catch (e) {
        window.localStorage.removeItem("TexCom");
    };
}

function resetParams() {
    window.localStorage.removeItem("TexCom");
    params = freshDefaults();
}

async function loadParams() {
    try {
        //        throw "null";
        let s = window.localStorage.getItem("TexCom");
        // var s = await idbKeyval.get("TexCom");
        if (s == null)
            throw "null";
        // Defaults first, then the user's saved settings on top: a setting added in an update gets its default
        // (it used to be undefined for anyone who already had TexCom), and nothing the user chose changes
        params = Object.assign(freshDefaults(), JSON.parse(s));
    } catch (e) {
        resetParams();
    };
    applyTheme(params.Theme);
    if (typeof applyLeftPane === 'function' && params.leftPaneFraction) applyLeftPane(params.leftPaneFraction);
}

// Swap only the theme-* class on <body>, leaving other state classes (e.g. keyboard-active) alone
function applyTheme(name) {
    if (!name || !name.startsWith('theme-')) name = 'theme-modern';
    [...document.body.classList].filter(c => c.startsWith('theme-')).forEach(c => document.body.classList.remove(c));
    document.body.classList.add(name);
}

var saveFile;

async function doSaveFile() {
    //    const fileHandleOrUndefined = await get("file");
    itemChanged = false;
    communicatorChanged = false;
    var name = currentCommunicatorName || 'TexCom.json';
    var text = JSON.stringify(manifestInfo, null, ' ')
    if (typeof showSaveFilePicker === 'function') {
        saveFile = await window.showSaveFilePicker({
            suggestedName: name,
            startIn: 'downloads',
            types: [{
                accept: {
                    'text/plain': ['.json'],
                }
            }],
        });
    } else {
        var text = JSON.stringify(manifestInfo, null, ' '); // was myBoard (undefined), so Save crashed without a file picker
        var file2 = new Blob([text], {
            type: "text/plain"
        });
        var a = document.createElement("a"),
            url = URL.createObjectURL(file2);
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();

        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        return;
    }

    const file = await saveFile.getFile();
    if (typeof saveFile !== "undefined") {
        if ((await saveFile.queryPermission()) === 'granted') {
            const writable = await saveFile.createWritable();
            //  myBoard.buttons[0].label = "Abc"; // chaamge button text
            var myJSON = JSON.stringify(manifestInfo, null, ' ');
            await writable.write(myJSON);
            await writable.close();
        }
    }
}

var fileObj;

function askToSave() {
    askConfirm({ title: 'Save your changes?', message: 'You have changed this phrase set. Save it before opening another?', ok: 'Save', cancel: 'Don’t save' })
        .then(save => { if (save) needToSave(); else document.getElementById('file-input').click(); });
    itemChanged = false;
    communicatorChanged = false;
}

function needToSave() {
    console.log("Need to save");
    if (webViewIOS)
        share.Share_Board();
    else {
        doSaveFile();
    }
}

var share = {
    Share_Board: async function () {
        setTimeout(clickSettings, 100);

        var name = currentCommunicatorName;
        var text = JSON.stringify(manifestInfo, null, ' ');

        var myBlob = new Blob([text], {
            type: "text/plain"
        });
        var file2 = new File([myBlob], name);
        await shareFile(file2);
    }
};

async function shareMessage() {
    let shareData = {
        text: theText.value
    }
    navigator.share(shareData)
        .then(() =>
            console.log('TexCom shared successfully')
        )
        .catch((e) =>
            console.log('Error: ' + e)
        )
}

async function shareFile(file) {
    const files = [];
    files.push(file);
    if (isChromium && isMac) { // special case for chrome on Mac
        let shareData2 = {
            text: JSON.stringify(manifestInfo, null, ' ')
        }
        navigator.share(shareData2)
            .then(() =>
                console.log('TexCom shared successfully')
            )
            .catch((e) => {
                console.log('Error: ' + e)
            })
        return;
    }

    let shareData = {
        title: 'TexCom.json',
        text: 'Share communicator',
        files
    }
    navigator.share(shareData)
        .then(() =>
            console.log('TexCom shared successfully')
        )
        .catch((e) => {
            console.log('Error: ' + e)
        })
}

async function saveToLocalStorage() {
        // await idbKeyval.set("TexCom", JSON.stringify(manifestInfo));
    localStorage.setItem("JsonTex", JSON.stringify(manifestInfo));
}

function processManifest() {
    if(typeof manifestInfo !== 'undefined') {
        manifestInfo.messages.forEach(msg => {
            if(!msg.emoji || msg.emoji === "▫️" || msg.emoji === "🔹" || msg.emoji.trim() === "") {
                msg.emoji = getBestEmoji(msg.name, msg.categories);
            }
        });
    }
    categoryList.innerHTML = "";
    theList.innerHTML = "";
    //    return;
    doingCategories = true;
    for (let i = 0; i < manifestInfo.categories.length; i++) {
        targetIndex = i;
        let li = document.createElement('li')
        li.className = "demo-no-reorder";
        li.innerHTML = makeLiText();
        li.dataset.bools = "fixed no-edit";
        li.style.color = manifestInfo.categories[i].colour;
        categoryList.appendChild(li);
    }
    if (typeof markSelectedCategory === 'function') markSelectedCategory();
    doingCategories = false;
    for (let i = 0; i < manifestInfo.messages.length; i++) {
        targetIndex = i;
        let li = document.createElement('li')
        li.className = "demo-no-reorder";
        li.innerHTML = makeLiText();
        li.dataset.bools = "fixed no-edit";
        li.style.color = manifestInfo.messages[i].colour;
        theList.appendChild(li);
    }
}



function toggleSettings() {
    let overlay = document.getElementById('settingsOverlay');
    if (overlay.style.display === 'flex') {
        overlay.classList.remove('open');
        setTimeout(() => overlay.style.display = 'none', 300);
        guiVisible = false;
    } else {
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('open'), 10);
        guiVisible = true;
    }
}

// Replace the old clickSettings global if sketch.js relies on it
window.clickSettings = toggleSettings;

function buildRow(labelText, controlHtml) {
    // Link the label to the first control so tapping the label works and screen readers announce it
    const m = controlHtml.match(/id="([^"]+)"/);
    return `<div class="settings-row"><label${m ? ` for="${m[1]}"` : ''}>${labelText}</label>${controlHtml}</div>`;
}

// A slider with its current value shown beside it
function buildSlider(id, min, max, step, value, format) {
    return `<span class="settings-slider-wrap"><input type="range" id="${id}" class="settings-slider" min="${min}" max="${max}" step="${step}" value="${value}"><output id="${id}_val" for="${id}">${format(value)}</output></span>`;
}
const fmtTimes = v => Number(v).toFixed(1) + '×';
const fmtPercent = v => Math.round(Number(v) * 100) + '%';

function buildSection(title, rowsHtml) {
    return `<div class="settings-section"><h3>${title}</h3>${rowsHtml}</div>`;
}


// The file inputs come after this script in index.html, so attach once the page is parsed
// (attaching immediately threw, and "Load Communicator" / "Add text from file" never worked)
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('file-input').addEventListener('change', function (evt) {
        fileObj = document.getElementById('file-input').files[0];
        let reader = new FileReader();
        reader.addEventListener('load', function (e) {
            manifestInfo = JSON.parse(e.target.result);
            if(typeof processManifest === 'function') processManifest();
            if(typeof saveToLocalStorage === 'function') saveToLocalStorage();
            if(typeof Notiflix !== 'undefined') Notiflix.Notify.success("Communicator Loaded!");
        });
        reader.readAsText(fileObj);
    });


    document.getElementById('text-input').addEventListener('change', function (evt) {
        let fileObj = document.getElementById('text-input').files[0];
        let reader = new FileReader();
        reader.addEventListener('load', function (e) {
            addTextFile(e.target.result);
        });
        reader.readAsText(fileObj);
    });
});

    async function addTextFile(text) {
        if(typeof clickSettings === 'function') setTimeout(clickSettings, 100);
        let lines = text.split('\n');
        let currentCategory = "";
        for (var i = 0; i < lines.length; i++) {
            var s;
            var pos = lines[i].indexOf("[");
            if (pos < 2 && pos >= 0) { // got a category
                s = lines[i].replace(/[\[\]']+/g, '').trim();
                let alreadyGotCategory = false;
                for (let j = 0; j < manifestInfo.categories.length; j++) {
                    if (s == manifestInfo.categories[j].name) {
                        alreadyGotCategory = true;
                        currentCategory = s;
                        break;
                    }
                }
                if (!alreadyGotCategory) {
                    currentCategory = s; // phrases that follow belong to the new category
                    manifestInfo.categories.push({
                        name: s,
                        emoji: getBestEmoji(s, ""),
                        colour: "#000000",
                        deletable: true,
                        fixed: false
                    });
                    let li = document.createElement('li')
                    li.className = "demo-no-reorder";
                    li.innerHTML = typeof makeLiText === 'function' ? makeLiText() : "▫️";
                    li.dataset.bools = "fixed no-edit"; 
                    if(typeof categoryList !== 'undefined') categoryList.appendChild(li);
                }
            } else { // messages
                s = lines[i].trim();
                if (s.length > 0) {
                    manifestInfo.messages.push({
                        name: s,
                        emoji: getBestEmoji(s, ""),
                        colour: "#000000",
                        deletable: true,
                        fixed: false,
                        abbreviation: " ",
                        instant: false,
                        categories: "[" + currentCategory + "]",
                        gotaudio: false,
                        audioData: "",
                    });
                    manifestInfo.lastMessageId = manifestInfo.messages.length;
                    let li = document.createElement('li')
                    li.className = "demo-no-reorder";
                    li.innerHTML = typeof makeLiText === 'function' ? makeLiText() : "▫️";
                    li.dataset.bools = "fixed no-edit"; 
                    if(typeof theList !== 'undefined') theList.appendChild(li);
                }
            }
        }
        if(typeof saveToLocalStorage === 'function') saveToLocalStorage();
        if(typeof processManifest === 'function') processManifest();
        if(typeof Notiflix !== 'undefined') Notiflix.Notify.success("Text Added!");
    }

function setUpGUI() {
    loadParams();
    
    // Add theme options to params if they don't exist
    if(params.Theme === "Theme" || !params.Theme) params.Theme = "theme-modern";
    
    let content = document.getElementById('settingsContent');
    if(!content) return;
    
    // --- GENERAL ---
    let generalHtml = `<button class="settings-action-btn" id="btn_help"><span aria-hidden="true">❓</span>Help</button>`;
    generalHtml += buildRow("Your name", `<input type="text" id="set_userName" class="settings-input" value="${params.UserName || ''}">`);
    generalHtml += buildRow("Theme", `
        <select id="set_theme" class="settings-input">
            <option value="theme-modern" ${params.Theme === 'theme-modern' ? 'selected' : ''}>Modern Clean</option>
            <option value="theme-contrast" ${params.Theme === 'theme-contrast' ? 'selected' : ''}>High Contrast</option>
            <option value="theme-playful" ${params.Theme === 'theme-playful' ? 'selected' : ''}>Playful</option>
            <option value="theme-ocean" ${params.Theme === 'theme-ocean' ? 'selected' : ''}>Ocean Breeze</option>
            <option value="theme-neon" ${params.Theme === 'theme-neon' ? 'selected' : ''}>Neon Cyberpunk</option>
            <option value="theme-dark" ${params.Theme === 'theme-dark' ? 'selected' : ''}>Dark Mode Classic</option>
            <option value="theme-forest" ${params.Theme === 'theme-forest' ? 'selected' : ''}>Forest Edge</option>
            <option value="theme-sunset" ${params.Theme === 'theme-sunset' ? 'selected' : ''}>Sunset Glow</option>
            <option value="theme-mono" ${params.Theme === 'theme-mono' ? 'selected' : ''}>Monochrome</option>
            <option value="theme-retro" ${params.Theme === 'theme-retro' ? 'selected' : ''}>Retro Terminal</option>
        </select>
    `);
    
    // --- CONVERSATION (partner anywhere: conversation.js) ---
    const conv = window.Conversation;
    let partnerHtml = `<p class="settings-note">Talk with someone anywhere: send them a link (or show the code). They can use any phone or computer, or their own TexCom. You choose who joins. Both need internet.</p>`;
    if (conv && conv.active) {
        partnerHtml += `<p class="settings-note"><strong>${conv.connected ? 'Talking with ' + conv.partnerName.replace(/[<>&]/g, '') : 'Waiting for someone to join'}</strong></p>`;
        partnerHtml += `<button class="settings-action-btn" id="btn_convEnd"><span aria-hidden="true">⏹</span>End conversation</button>`;
    } else {
        partnerHtml += `<button class="settings-action-btn" id="btn_convStart"><span aria-hidden="true">🔗</span>Start a conversation…</button>`;
        partnerHtml += `<button class="settings-action-btn" id="btn_convJoin"><span aria-hidden="true">📥</span>Join a conversation…</button>`;
    }
    partnerHtml += buildRow("Read partner's messages aloud", `<input type="checkbox" id="set_readAloud" class="settings-checkbox" ${params.readPartnerAloud ? 'checked' : ''}>`);
    if (window.partnerWindowAvailable) {
        // Mac debug builds only: a second window standing in for the partner's screen
        partnerHtml += `<button class="settings-action-btn" id="btn_partnerWindow"><span aria-hidden="true">🖥️</span>Open partner window (debug)</button>`;
    }

    // --- SMART AI ---
    let isNative = window.deviceSupportsAI;
    let disAttr = isNative ? "" : "disabled";
    let aiTitle = "Smart AI Features";
    let aiHtml = '';
    // Works everywhere: the panel only shows the conversation (the AI uses it either way)
    aiHtml += buildRow("Show chat history", `<input type="checkbox" id="set_chat" class="settings-checkbox" ${params.chatInterface ? 'checked' : ''}>`);
    if (!isNative) {
        // Always-visible explanation (the old "?" was a hover-only tooltip, unreadable on touch screens)
        aiHtml += `<p class="settings-note">The features below run privately on the device, so they need the TexCom app for iPhone, iPad, Mac or Android. They aren't available in a web browser.</p>`;
    }
    aiHtml += `<div id="smartAIGrid"${isNative ? '' : ' class="settings-unavailable"'}>`;
    aiHtml += buildRow("Smart Expand (type @)", `<input type="checkbox" id="set_expand" class="settings-checkbox" ${isNative && params.llmExpansion ? 'checked' : ''} ${disAttr}>`);
    aiHtml += buildRow("Start listening when TexCom opens", `<input type="checkbox" id="set_ambient" class="settings-checkbox" ${isNative && params.ambientListening ? 'checked' : ''} ${disAttr}>`);
    aiHtml += `<button class="settings-action-btn" id="btn_editPersona" ${disAttr}><span aria-hidden="true">🧑</span>Edit AI persona…</button>`;
    aiHtml += `</div>`;
    
    // --- SPEECH ---
    if (params.voiceVolume === undefined || params.voiceVolume === null) params.voiceVolume = 1;
    let speechHtml = buildRow("Voice", `<select id="set_voice" class="settings-input"></select>`);
    speechHtml += buildRow("Pitch", buildSlider('set_pitch', 0.1, 2.0, 0.1, params.voicePitch, fmtTimes));
    speechHtml += buildRow("Speed", buildSlider('set_rate', 0.1, 2.0, 0.1, params.voiceRate, fmtTimes));
    speechHtml += buildRow("Volume", buildSlider('set_volume', 0, 1, 0.1, params.voiceVolume, fmtPercent));
    speechHtml += `<button class="settings-action-btn" id="btn_testVoice"><span aria-hidden="true">🔊</span>Test voice</button>`;
    
    // --- DATA ---
    let dataHtml = '';
    if (starterUpdate && starterUpdate.phrases.length) {
        dataHtml += `<button class="settings-action-btn" id="btn_newPhrases"><span aria-hidden="true">🆕</span>Add ${starterUpdate.phrases.length} new TexCom phrases…</button>`;
    }
    dataHtml += `<button class="settings-action-btn" id="btn_addText"><span aria-hidden="true">📄</span>Import phrases from a text file…</button>`;
    dataHtml += `<button class="settings-action-btn" id="btn_loadBoard"><span aria-hidden="true">📂</span>Open phrase set…</button>`;
    dataHtml += `<button class="settings-action-btn" id="btn_saveBoard"><span aria-hidden="true">💾</span>Save phrase set…</button>`;
    dataHtml += `<button class="settings-action-btn" id="btn_shareBoard"><span aria-hidden="true">📤</span>Share phrase set</button>`;
    
    content.innerHTML = buildSection("General", generalHtml) + 
                        buildSection("Conversation", partnerHtml) +
                        buildSection(aiTitle, aiHtml) + 
                        buildSection("Speech", speechHtml) + 
                        buildSection("Data & Sharing", dataHtml);

    // Bind Events
    document.getElementById('btn_help').onclick = () => { toggleSettings(); if (window.openHelp) openHelp(); };
    document.getElementById('set_userName').onchange = (e) => { params.UserName = e.target.value; saveParams(); };
    document.getElementById('set_theme').onchange = (e) => { 
        params.Theme = e.target.value; 
        applyTheme(params.Theme);
        saveParams(); 
    };
    document.getElementById('set_chat').onchange = (e) => { 
        params.chatInterface = e.target.checked; 
        saveParams(); 
        if(typeof toggleChatInterface === 'function') toggleChatInterface(typeof chatShouldShow === 'function' ? chatShouldShow() : params.chatInterface); 
    };
    const bindConv = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = () => { toggleSettings(); fn(); }; };
    bindConv('btn_convStart', () => window.startConversation && startConversation());
    bindConv('btn_convJoin', () => window.openJoinConversation && openJoinConversation());
    bindConv('btn_convEnd', () => window.Conversation && Conversation.end());
    document.getElementById('set_readAloud').onchange = (e) => { params.readPartnerAloud = e.target.checked; saveParams(); };
    
    document.getElementById('set_expand').onchange = (e) => { params.llmExpansion = e.target.checked; saveParams(); };
    let elAmbient = document.getElementById('set_ambient');
    if(elAmbient) {
        elAmbient.onchange = (e) => { 
            params.ambientListening = e.target.checked; // takes effect next launch; the toolbar 🎙 button is the on/off switch
            saveParams(); 
        };
    }
    document.getElementById('btn_editPersona').onclick = () => { if(typeof personaObj !== 'undefined') personaObj.editPersona(); };
    
    // Populate voices dynamically
    setTimeout(() => {
        let voiceSelect = document.getElementById('set_voice');
        let sl = [];
        if (typeof doingSAPI !== 'undefined' && doingSAPI && typeof SAPInames !== 'undefined' && SAPInames) {
            sl = SAPInames.split(',');
        } else if (typeof webViewIOS !== 'undefined' && webViewIOS && typeof IOSnames !== 'undefined' && IOSnames) {
            sl = ['Default'].concat(IOSnames.split(',')); // "Default" = the system voice, which is used until one is chosen
        } else if ('speechSynthesis' in window) {
            let v = window.speechSynthesis.getVoices();
            // If running as a PWA, only show local voices
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
            if (isPWA) {
                v = v.filter(voice => voice.localService === true);
            }
            sl = v.map(voice => voice.name + ': ' + voice.lang);
        }
        if(voiceSelect && sl.length > 0) {
            window.speechList = sl;
            voiceSelect.innerHTML = sl.map(v => `<option value="${v}" ${params.currentVoice === v ? 'selected' : ''}>${v}</option>`).join('');
            voiceSelect.onchange = (e) => {
                params.currentVoice = e.target.value;
                saveParams();
                changeVoice(params.currentVoice);
                previewVoice();
            };
        }
    }, 1000);
    
    // Sliders: show the value while dragging; apply and preview when released
    [['set_pitch', 'voicePitch', fmtTimes], ['set_rate', 'voiceRate', fmtTimes], ['set_volume', 'voiceVolume', fmtPercent]].forEach(([id, key, fmt]) => {
        const el = document.getElementById(id);
        el.oninput = (e) => { document.getElementById(id + '_val').textContent = fmt(e.target.value); };
        el.onchange = (e) => {
            params[key] = parseFloat(e.target.value);
            saveParams();
            changeVoice(params.currentVoice);
            previewVoice();
        };
    });
    document.getElementById('btn_testVoice').onclick = () => previewVoice();
    let partnerBtn = document.getElementById('btn_partnerWindow');
    if (partnerBtn) partnerBtn.onclick = () => openPartnerWindow();
    
    const newBtn = document.getElementById('btn_newPhrases');
    if (newBtn) newBtn.onclick = () => { toggleSettings(); addNewPhrases(); };
    document.getElementById('btn_addText').onclick = () => { 
        let textInput = document.getElementById('text-input');
        if(textInput) textInput.click();
    };
    document.getElementById('btn_loadBoard').onclick = () => { 
        if (typeof communicatorChanged !== 'undefined' && communicatorChanged && typeof askToSave === 'function') {
            askToSave(typeof currentCommunicatorName !== 'undefined' ? currentCommunicatorName : "");
        } else {
            document.getElementById('file-input').click();
        }
    };
    document.getElementById('btn_saveBoard').onclick = () => { doSaveFile(); }; // was save.Save_Communicator_To_File(), which didn't exist
    document.getElementById('btn_shareBoard').onclick = () => { if(typeof share !== 'undefined' && share.Share_Board) share.Share_Board(); };

    changeVoice(params.currentVoice);
}

// Speak a sample with the current voice settings, without adding it to the chat history or asking the AI
function previewVoice() {
    if (typeof mute === 'function') mute();
    if (typeof speak === 'function') speak("This is how I sound.", true);
}

function changeVoice(name) {
    var s = name;
    voiceName = s;
    if (doingSAPI) {
        window.chrome.webview.postMessage("Voice:" + name);
        window.chrome.webview.postMessage("Speed:" + Math.round(params.voiceRate*5));
        window.chrome.webview.postMessage("Volume:" + Math.round(params.voiceVolume*10));
    }
    else if (webViewIOS) {
        name = name.substring(0, name.indexOf(":"))
        window.webkit.messageHandlers.TexCom.postMessage({
                "m": "Voice:" + name
            });
        // Raw web-scale values, as at startup; the app converts them to AVSpeech's scales
        window.webkit.messageHandlers.TexCom.postMessage({
                "m": "Pitch:" + params.voicePitch
            });
        window.webkit.messageHandlers.TexCom.postMessage({
                "m": "Speed:" + params.voiceRate
            });
        window.webkit.messageHandlers.TexCom.postMessage({
                "m": "Volume:" + params.voiceVolume
            });
    }
    else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
        let cleanName = name;
        if(name.indexOf(":") > -1) cleanName = name.substring(0, name.indexOf(":"));
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Voice:" + cleanName }));
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Pitch:" + params.voicePitch }));
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Speed:" + params.voiceRate }));
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Volume:" + params.voiceVolume }));
    }
    else {
      var s = name;
      s = s.substr(0, s.indexOf(':'));
        voices = synth.getVoices();
        for (let i = 0; i < voices.length; i++)
            if (voices[i].name == s) {
                voiceIndex = i;
                break;
            }
      // params.currentVoice.substr(params.currentVoice.indexOf(":'));
        // speak(s);
    }
}

var voices;
var voiceIndex;

var personaObj = {
    editPersona: function() {
        let phtml = `
        <div style="background: var(--bg-panel); color: var(--btn-text); padding: 20px; border-radius: 12px; max-width: 90vw; max-height: 90vh; overflow-y: auto;">
            <h2 style="margin-top: 0;">Edit AI Persona</h2>
            <p style="font-size: 0.9em; opacity: 0.8;">Describe yourself to the AI. It will use this to personalize your auto-replies and text predictions.</p>
            
            <div style="margin-bottom: 10px;">
                <label for="p_custom" style="display:block; font-weight:bold;">Custom Details (e.g. 45-year-old from London, sarcastic humor)</label>
                <textarea id="p_custom" style="width: 100%; height: 80px; background: var(--bg-main); color: var(--btn-text); border: 1px solid var(--border-color);">${params.userPersona || ''}</textarea>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label for="p_pronouns" style="display:block; font-weight:bold;">Pronouns</label>
                <select id="p_pronouns" style="width: 100%; padding: 5px; background: var(--bg-main); color: var(--btn-text);">
                    <option value="Not Specified">Not Specified</option>
                    <option value="He / Him">He / Him</option>
                    <option value="She / Her">She / Her</option>
                    <option value="They / Them">They / Them</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label for="p_tone" style="display:block; font-weight:bold;">AI Tone</label>
                <select id="p_tone" style="width: 100%; padding: 5px; background: var(--bg-main); color: var(--btn-text);">
                    <option value="Friendly">Friendly</option>
                    <option value="Professional">Professional</option>
                    <option value="Sarcastic">Sarcastic</option>
                    <option value="Witty">Witty</option>
                    <option value="Direct">Direct</option>
                    <option value="Polite">Polite</option>
                    <option value="Enthusiastic">Enthusiastic</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label for="p_formality" style="display:block; font-weight:bold;">AI Formality</label>
                <select id="p_formality" style="width: 100%; padding: 5px; background: var(--bg-main); color: var(--btn-text);">
                    <option value="Casual">Casual</option>
                    <option value="Formal">Formal</option>
                    <option value="Slang / Youthful">Slang / Youthful</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label for="p_disability" style="display:block; font-weight:bold;">Primary Condition</label>
                <select id="p_disability" style="width: 100%; padding: 5px; background: var(--bg-main); color: var(--btn-text);">
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="ALS / MND">ALS / MND</option>
                    <option value="Cerebral Palsy">Cerebral Palsy</option>
                    <option value="Autism">Autism</option>
                    <option value="Aphasia">Aphasia</option>
                    <option value="Stroke / Brain Injury">Stroke / Brain Injury</option>
                    <option value="Non-speaking">Non-speaking</option>
                    <option value="Wheelchair User">Wheelchair User</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label for="p_disclosure" style="display:block; font-weight:bold;">AAC Disclosure</label>
                <select id="p_disclosure" style="width: 100%; padding: 5px; background: var(--bg-main); color: var(--btn-text);">
                    <option value="Private (Do not mention)">Private (Do not mention)</option>
                    <option value="Prefer not to say (Decline to answer)">Prefer not to say (Decline to answer)</option>
                    <option value="Brief (Mention AAC if asked)">Brief (Mention AAC if asked)</option>
                    <option value="Informative (Explain AAC)">Informative (Explain AAC)</option>
                    <option value="Humorous">Humorous</option>
                </select>
            </div>
            
            <div style="margin-bottom: 10px;">
                <label for="p_hearing" style="display:block; font-weight:bold;">Hearing Status</label>
                <select id="p_hearing" style="width: 100%; padding: 5px; background: var(--bg-main); color: var(--btn-text);">
                    <option value="Not Specified">Not Specified</option>
                    <option value="Deaf (Ask to speak to device)">Deaf (Ask to speak to device)</option>
                    <option value="Hard of Hearing (Ask to speak clearly)">Hard of Hearing (Ask to speak clearly)</option>
                </select>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                <button id="p_cancel" style="padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--btn-text); cursor: pointer;">Cancel</button>
                <button id="p_save" style="padding: 10px 20px; border-radius: 8px; border: none; background: #3b82f6; color: white; cursor: pointer; font-weight: bold;">Save</button>
            </div>
        </div>
        `;
        
        let overlay = document.createElement('div');
        overlay.id = "personaOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.5)";
        overlay.style.zIndex = "15000";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.innerHTML = phtml;
        document.body.appendChild(overlay);
        
        // set values
        if(params.personaPronouns) document.getElementById('p_pronouns').value = params.personaPronouns;
        if(params.personaTone) document.getElementById('p_tone').value = params.personaTone;
        if(params.personaFormality) document.getElementById('p_formality').value = params.personaFormality;
        if(params.personaDisability) document.getElementById('p_disability').value = params.personaDisability;
        if(params.personaDisclosure) document.getElementById('p_disclosure').value = params.personaDisclosure;
        if(params.personaHearing) document.getElementById('p_hearing').value = params.personaHearing;
        
        const closePersona = () => { overlay.remove(); document.removeEventListener('keydown', onPersonaKey); };
        const onPersonaKey = (e) => { if (e.key === 'Escape') closePersona(); };
        document.addEventListener('keydown', onPersonaKey);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closePersona(); });
        document.getElementById('p_custom').focus();
        document.getElementById('p_cancel').onclick = closePersona;
        document.getElementById('p_save').onclick = () => {
            params.userPersona = document.getElementById('p_custom').value;
            params.personaPronouns = document.getElementById('p_pronouns').value;
            params.personaTone = document.getElementById('p_tone').value;
            params.personaFormality = document.getElementById('p_formality').value;
            params.personaDisability = document.getElementById('p_disability').value;
            params.personaDisclosure = document.getElementById('p_disclosure').value;
            params.personaHearing = document.getElementById('p_hearing').value;
            saveParams();
            closePersona();
            if(typeof Notiflix !== 'undefined') { Notiflix.Notify.success("Persona saved!"); }
        };
    }
};


// ---------- New TexCom phrases, for people who already have their own phrase set ----------
// Their phrases are never changed or removed. After an update, starter phrases whose text isn't already in
// their set can be added (Settings > Data), into a "New phrases" category to review, keep or delete.
let starterUpdate = null; // { version, phrases }
function normPhrase(s) { return (s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, ''); }

async function checkForNewPhrases() {
    try {
        if (!localStorage.getItem('JsonTex') || typeof manifestInfo === 'undefined' || !manifestInfo) return; // a fresh start already has them all
        const starter = await (await fetch('TexCom.json', { cache: 'no-store' })).json();
        const have = new Set(manifestInfo.messages.map(m => normPhrase(m.name)));
        const seen = new Set();
        const phrases = starter.messages.filter(m => {
            const k = normPhrase(m.name);
            if (!k || have.has(k) || seen.has(k)) return false;
            seen.add(k); return true;
        });
        starterUpdate = { version: String(starter.version || ''), phrases };
        // Mention it once per update; the Settings button stays for later
        if (phrases.length && localStorage.getItem('texcomNewPhrasesOffered') !== starterUpdate.version) {
            localStorage.setItem('texcomNewPhrasesOffered', starterUpdate.version);
            if (typeof Notiflix !== 'undefined' && Notiflix.Notify)
                Notiflix.Notify.info(phrases.length + ' new TexCom phrases are available. You can add them in Settings > Data.', { timeout: 8000 });
        }
    } catch (e) {}
}

function addNewPhrases() {
    const u = starterUpdate;
    if (!u || !u.phrases.length) return;
    const n = u.phrases.length;
    const go = () => {
        const NEW = 'New phrases';
        if (!manifestInfo.categories.some(c => c.name === NEW)) {
            manifestInfo.categories.splice(Math.min(2, manifestInfo.categories.length), 0,
                { name: NEW, emoji: '🆕', colour: '#000000', deletable: true, fixed: false });
        }
        const cats = new Set(manifestInfo.categories.map(c => c.name));
        u.phrases.forEach(p => {
            const copy = JSON.parse(JSON.stringify(p));
            // keep the phrase's own categories only where the user still has them; never Favourites
            const keep = (copy.categories.match(/\[[^\]]+\]/g) || []).filter(c => c !== '[Favourites]' && cats.has(c.slice(1, -1)));
            copy.categories = keep.join('') + '[' + NEW + ']';
            manifestInfo.messages.push(copy);
        });
        u.phrases = [];
        saveToLocalStorage();
        processManifest();
        categoryName = NEW;
        if (typeof updateWithCategory === 'function') updateWithCategory();
        if (typeof afterListChange === 'function') afterListChange();
        if (typeof Notiflix !== 'undefined' && Notiflix.Notify)
            Notiflix.Notify.success('Added ' + n + ' phrases to "New phrases". Keep the ones you like; delete the others in Edit mode.', { timeout: 8000 });
    };
    askConfirm({
        title: 'New phrases',
        message: 'Add ' + n + ' new TexCom phrases? They go into a "New phrases" category for you to look through. None of your own phrases are changed or removed.',
        ok: 'Add them', cancel: 'Not now',
    }).then(yes => { if (yes) go(); });
}
