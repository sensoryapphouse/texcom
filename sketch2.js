
function extractAIOptions(raw) {
    if(!raw) return [];
    
    // Attempt 1: Numbered list pattern (e.g., "1. Play 2. Walk 3. Relax" or "1) Hey 2) Hi 3) Hello")
    // Use regex to look for the numbers and extract the text between them
    let regex = /(?:1[\.\)])(.+?)(?:2[\.\)])(.+?)(?:3[\.\)])(.*)/i;
    let matches = raw.match(regex);
    if(matches && matches.length >= 4) {
        return [
            matches[1].trim().replace(/^["'*]+|["'*]+$/g, ''),
            matches[2].trim().replace(/^["'*]+|["'*]+$/g, ''),
            matches[3].trim().replace(/^["'*]+|["'*]+$/g, '')
        ];
    }
    
    // Attempt 2: Pipe separated (what we asked for)
    let pipeOpts = raw.split('|').map(s => s.trim().replace(/^["'*]+|["'*]+$/g, '')).filter(s => s.length > 0);
    if(pipeOpts.length >= 3) return pipeOpts.slice(-3); // If they prepend boilerplate and then use pipes
    
    // Attempt 3: If there are no pipes and no numbers, strip the polite boilerplate anyway
    let clean = raw.replace(/(Sure|Okay|Here are).*?:/ig, '').trim();
    let numSplits = clean.split(/(?:1|2|3)[\.\)]/).map(s=>s.trim().replace(/^["'*]+|["'*]+$/g, '')).filter(s=>s.length>0);
    if(numSplits.length >= 3) return numSplits.slice(0,3);
    
    // Fallback
    if(pipeOpts.length > 0) return pipeOpts;
    
    // Absolute fallback: truncate the string to fit UI
    return [clean.substring(0, 50), "Error parsing", "Please try again"];
}

function getFullPersona() {
    let p = [];
    if(params.personaPronouns && params.personaPronouns !== 'Not Specified') p.push("Pronouns: " + params.personaPronouns);
    if(params.personaTone) p.push("Tone: " + params.personaTone);
    if(params.personaFormality) p.push("Formality: " + params.personaFormality);
    
    if(params.personaDisability && params.personaDisability !== 'Prefer not to say') {
        p.push("Disability / Condition: " + params.personaDisability);
    }
    
    if(params.personaDisclosure) {
        if(params.personaDisclosure === 'Brief (Mention AAC if asked)') p.push("Disability Context: Mention you use an AAC device if asked");
        else if(params.personaDisclosure === 'Prefer not to say (Decline to answer)') p.push("Disability Context: If asked about your disability or device, politely but firmly decline to answer and say you prefer not to discuss it.");
        else if(params.personaDisclosure === 'Informative (Explain AAC)') p.push("Disability Context: Be open and informative about using an AAC device");
        else if(params.personaDisclosure === 'Humorous') p.push("Disability Context: Make lighthearted jokes about using a robot voice/AAC device");
        else p.push("Disability Context: Private (Do not mention disability or AAC)");
    }
    
    if(params.personaHearing) {
        if(params.personaHearing === 'Deaf (Ask to speak to device)') p.push("Hearing Status: You are Deaf. Ask the partner to speak clearly into the device so it can transcribe their words for you to read, or ask them to type on the Companion App/Bluetooth Keyboard.");
        else if(params.personaHearing === 'Hard of Hearing (Ask to speak clearly)') p.push("Hearing Status: You are Hard of Hearing. Ask the partner to speak clearly and loudly into the device so it can transcribe their words.");
    }
    
    if(params.userPersona && params.userPersona.trim().length > 0) p.push("Custom Details: " + params.userPersona.trim());
    
    // Inject Rolling Chat History Context for better AI awareness
    if (window.rollingChatHistory && window.rollingChatHistory.length > 0) {
        let hist = window.rollingChatHistory.map(m => m.role + ": " + m.text).join(" | ");
        p.push("Recent Conversation Context: [" + hist + "]");
    }
    
    return p.join(", ");
}

window.sendLog = function(msg) {
    if(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
        window.webkit.messageHandlers.TexCom.postMessage({"m": "Log: " + msg});
    }
};
window.onerror = function(msg, url, lineNo, columnNo, error) {
    window.sendLog("GLOBAL ERROR: " + msg + " at " + lineNo + ":" + columnNo);
    return false;
};
window.sendLog("sketch2.js started!");
/*
json file:
{
    "Description": "TexCom",
    "Language": "En",
    "Categories": {
        {
         "name": "All",
         "editable: "false",
         "deleteable": "false",
         "fixed": "true"
          "emoji": "🔷"
         },
        {
         "name": "Favourites",
         "editable: "false",
         "deleteable": "false",
         "fixed": "true"
          "emoji": "❤️"
         },
         {
         "name": "Greetings",
         "icon": "path",
         "editable: "true",
         "deleteable": "true",
         "fixed": "false",
         "emoji": " "
         } 
    },
    "Messages": {
         "text": "Hello.",
         "emoji": "❤️",
         "Categories":"Favourites Greetings",
         "deleteable": "true",
         "fixed": "false",
         "instant": "true",
         "colour": "red",
         "abbreviation": "",
         "recording: ""
         },
         "text": "My name is ****.",
         "emoji": "❤️",
         "abbreviation" : "n",
         "Categories":"Favourites Greetings",
         "deleteable": "true",
         "fixed": "true",
         "instant": "false",
         "colour": "blue",
         "abbreviation": "",
         "recording: ""
         },
    }
}

Settings {
    User Name
    Voice params
    Show tooltips
    Import text file
    Import communicator
    Export communicator
    Share
    Language
}

Replace [***] with name
[:body] opens category body
*/

var autoPredict = -1;
var filterPredict = "";
var btnFlip = document.getElementById('flip');
var tmrKeys = null;
var helpSplash;
var PopupMenu, PopupMenuItem, PopupMenuPosition;
import('./libraries/popup-menu.js').then(module => {
    PopupMenu = module.default;
    PopupMenuItem = module.PopupMenuItem;
    PopupMenuPosition = module.PopupMenuPosition;
    
    itemList = [
        new PopupMenuItem("Edit", 'Edit', './images/edit.svg'),
        new PopupMenuItem("Add", 'Add new entry', './images/add.svg'),
        new PopupMenuItem("Delete", 'Delete', './images/delete.svg'),
    ];

    itemListNoDelete = [
        new PopupMenuItem("Edit", 'Edit', './images/edit.svg'),
        new PopupMenuItem("Add", 'Add new entry', './images/add.svg')
    ];
});

document.body.addEventListener("wheel", e=>{
  if(e.ctrlKey)
    e.preventDefault();//prevent zoom
});





function updateCategoriesButton() {
    if (freeVersion) {
        theCategoriesButton.innerHTML = "Phrase List";
        theCategoriesButton.style.textAlign = "center";
        return;
    }
    let isLargeLandscape = !smallPortrait;
    if (smallPortrait || isLargeLandscape) {
        if (categoryList.hidden)
            theCategoriesButton.innerHTML = "Categories: " + categoryName + " ⏩"; // 🔽
        else
            theCategoriesButton.innerHTML = "Categories: " + categoryName + "  🔼";
        theCategoriesButton.style.textAlign = "center";
    } else {
        theCategoriesButton.innerHTML = "Categories: " + categoryName + " ⏩";
        theCategoriesButton.style.textAlign = "center";
    }
}

function pushHistory() {
    undoButton.style.opacity = "1";
    if (theText.value.length == 0) {
        return;
    }
    undoButton.style.opacity = "1";
    redoButton.style.opacity = "0.5";
    if (txHistory[txHistory.length - 1] != theText.value) {
        if (txHistory.length > 250)
            txHistory.shift();
        placeInHistory = txHistory.length;
        txHistory.push(theText.value);
    }
}

window.onload = () => {
    

    const buttons = ['speakButton', 'undoButton', 'redoButton', 'yesButton', 'noButton', 'sosButton', 'bellButton', 'favButton', 'uploadButton', 'settingsButton', 'clearButton', 'startSplash', 'theCategoriesButton', 'helpSplash', 'btnFlip'];
    buttons.forEach(id => {
        if(!window[id]) window[id] = document.getElementById(id) || document.createElement('button');
    });
    if(!window.filter) window.filter = document.getElementById('the-filter') || document.createElement('input');
    if(!window.txtText) window.txtText = document.getElementById('txtText') || document.createElement('input');

    // The phrase filter: the words typed after the text box's last punctuation (doPredict). There is no Search box any
    // more; this is a detached field holding the filter text, and #filterInfo shows it while it is in use.
    if (!(window.filter instanceof HTMLInputElement)) window.filter = document.createElement('input');
    window.clearButton = document.getElementById('clearButton') || document.getElementById('clear');
    if(!window.clearButton) window.sendLog('clearButton still not found in DOM!');
    window.speakButton = document.getElementById('speakButton');
    window.undoButton = document.getElementById('undoButton');
    window.redoButton = document.getElementById('redoButton');
    window.yesButton = document.getElementById('yesButton');
    window.noButton = document.getElementById('noButton');
    window.sosButton = document.getElementById('sosButton');
    window.bellButton = document.getElementById('bellButton');
    window.favButton = document.getElementById('favButton');
    window.buttonPanel = document.getElementById('buttonPanel');

    //    localStorage.clear();
    'use strict';
    if ('serviceWorker' in navigator && !testing && location.protocol.startsWith('http')) { // not in the native apps (file://)
        navigator.serviceWorker
            .register('./sw.js');
    }
    
    helpSplash = document.querySelector('helpSplash');
    helpSplash.onclick = function (e) {
        e.stopPropagation();
        e.preventDefault();
        openHelp(); // in a panel over TexCom (it used to replace the page, with no way back in the apps)
    }

    splash = document.querySelector('splash');
    startSplash = document.querySelector('startSplash');
    startSplash.hidden = false;
    document.documentElement.style.overflow = 'hidden'; // hide scroll barsfirefox, chrome
    document.body.scroll = "no"; // ie only
    theText = document.getElementById('theText');
    theCategoriesButton = document.getElementById('theCategories');
    categoryList = document.getElementById('categoryList');
    buttonPanel = document.querySelector('buttonPanel');
    initLanguages();

    theList = document.getElementById('messagesList');
    setupSlip(theList);
    setupSlip(categoryList);

    // to set all the list to particular class(es)
    let children = [...theList.children];
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        //        child.className = "demo-no-reorder"; // demo-no-swipe";
        //        child.className = "";
        //        var s = child.innerHTML;
        if (!child.innerHTML.includes('<span class="quick"></span>'))
            child.innerHTML = child.innerHTML + '<span class="edit"></span><span class="quick"></span>';
    }

    theCategoriesButton.onclick = function (e) {
        if (freeVersion)
            return;
        filter.value = "";
        if (smallPortrait) {
            categoryList.hidden = !categoryList.hidden;
        } else {
            categoryList.hidden = false;
        }
        updateCategoriesButton();
        filter.onkeyup();
    }

//    splash.hidden = true;
//    startSplash.hidden = true;
    startSplash.onclick = function (e) {
        startSplash.hidden = true;
        splash.hidden = true;
        helpSplash.hidden = true;
        setTimeout(function() {
            setUpGUI();
        }, 100);
    }
    
    loadManifest();
    smallPortrait = isOneColumnLayout();
    setUpPanel();
    windowResized();

    if(window.clearButton) window.clearButton.onclick = function (e) {
        // Clear chat history context
        window.rollingChatHistory = [];
        let historyContainer = document.getElementById('chatHistoryContainer');
        if (historyContainer) historyContainer.innerHTML = '';
        if (typeof toggleChatInterface === 'function') toggleChatInterface(typeof chatShouldShow === 'function' ? chatShouldShow() : params.chatInterface); // nothing to show: hides it
        
        // Also clear any pending contextual AI phrases from the UI
        let msgList = document.getElementById('messagesList');
        if (msgList) {
            let oldReplies = msgList.querySelectorAll('.ai-injected-reply');
            oldReplies.forEach(el => el.remove());
        }

        if (theText.value == "")
            return;
            
        filter.value = "";
        filterPredict = "";
        updateList();
        pushHistory();
        window.sendLog('clearButton pushHistory done. txHistory length: ' + txHistory.length + ', placeInHistory: ' + placeInHistory);
        theText.value = "";
        let box = document.getElementById('aiPredictionBox');
        if(box) box.style.display = 'none';
        theText.focus();
    }

    speakButton.onclick = function (e) {
        speak(theText.value);
        theText.focus();
    }
    buttonPanel.onclick = function (e) {
        //        buttonPanel.hidden = true;
    }
    undoButton.onclick = function (e) {
        window.sendLog('undoButton called. txHistory length: ' + txHistory.length + ', placeInHistory: ' + placeInHistory);
        if (placeInHistory == txHistory.length - 1)
            pushHistory();
        placeInHistory--;
        if (placeInHistory < 0) {
            placeInHistory = -1;
            theText.value = "";
            undoButton.style.opacity = ".5";
            redoButton.style.opacity = "1";
        } else {
            undoButton.style.opacity = "1";
            theText.value = txHistory[placeInHistory];
            redoButton.style.opacity = "1";
        }
        console.log("Undo: ", placeInHistory);
        if(typeof theText.oninput === 'function') theText.oninput({stopPropagation: () => {}, key: 'Unidentified'});
        theText.focus();
    }
    redoButton.onclick = function (e) {
        window.sendLog('redoButton called. txHistory length: ' + txHistory.length + ', placeInHistory: ' + placeInHistory);
        placeInHistory++;
        if (placeInHistory >= txHistory.length) {
            placeInHistory = txHistory.length - 1;
            redoButton.style.opacity = ".5";
        } else {
            theText.value = txHistory[placeInHistory];
            undoButton.style.opacity = "1";
            redoButton.style.opacity = "1";
        }
        if(typeof theText.oninput === 'function') theText.oninput({stopPropagation: () => {}, key: 'Unidentified'});
        theText.focus();
        if(typeof theText.oninput === 'function') theText.oninput({stopPropagation: () => {}, key: 'Unidentified'});
        undoButton.style.opacity = "1";
        console.log("Redo: ", placeInHistory);
    }
    yesButton.onclick = function (e) {
        speak('Yes');
    }
    noButton.onclick = function (e) {
        speak('No');
    }
    sosButton.onclick = function (e) {
        console.log("SOS");
        SOS();
    }
    bellButton.onclick = function (e) {
        console.log("Hector");
        var audio = new Audio('bell.m4a');
        audio.play();
    }
    // Adds the text box to Favourites: tags the phrase with the same words if there is one, otherwise makes a new
    // phrase. (It used to tag the last phrase tapped, not the matching one, and could add an empty phrase.)
    favButton.onclick = function (e) {
        const str = theText.value.trim();
        const note = (kind, msg) => { if (typeof Notiflix !== 'undefined' && Notiflix.Notify) Notiflix.Notify[kind](msg, { timeout: 3000 }); };
        if (!str) { note('info', 'Type or choose a phrase first, then press ♡ to add it to Favourites.'); return; }
        const key = normPhrase(str);
        const match = manifestInfo.messages.find(m => normPhrase(m.name) === key);
        if (match) {
            if ((match.categories || '').includes('[Favourites]')) { note('info', 'That’s already in Favourites.'); return; }
            match.categories = (match.categories || '') + '[Favourites]';
        } else {
            manifestInfo.messages.unshift({
                name: str,
                emoji: typeof getBestEmoji === 'function' ? getBestEmoji(str, '') : '💬',
                colour: '#000000',
                deletable: true,
                fixed: false,
                abbreviation: '',
                instant: false,
                categories: '[Favourites]',
                gotaudio: false,
                audioData: '',
            });
            manifestInfo.lastMessageId = manifestInfo.messages.length;
        }
        saveToLocalStorage();
        processManifest();  // rebuild the lists so the phrase (and Favourites) show it straight away
        if (typeof updateWithCategory === 'function') updateWithCategory();
        if (typeof afterListChange === 'function') afterListChange();
        note('success', 'Added to Favourites.');
    }
    uploadButton.onclick = function (e) {
        console.log("Share");
        shareMessage();
    }
    settingsButton.onclick = function (e) {
        clickSettings();
        console.log("Settings");
    }
    theText.onclick = function (e) {
        mute();
    }
    theText.onkeydown = function (e) { // stop h key showing menu
        e.stopPropagation();
        if (e.key == "Control") {
            btnFlip.innerHTML = theText.value;
            btnFlip.hidden = false;
        }
    }
window.receiveExpandedText = function(expanded) {
    if(typeof Notiflix !== 'undefined' && Notiflix.Loading) {
        Notiflix.Loading.remove();
    }
    
    if (expanded.startsWith("Error:")) {
        if(typeof Notiflix !== 'undefined') {
            Notiflix.Notify.failure(expanded.replace("Error: ", ""));
        } else {
            console.error(expanded);
        }
        return;
    }
    
    if (theText) {
        theText.value = expanded + " ";
        theText.focus();
        theText.selectionStart = theText.value.length;
        theText.selectionEnd = theText.value.length;
        theText.scrollTop = theText.scrollHeight;
        if(typeof theText.oninput === 'function') theText.oninput({stopPropagation: () => {}, key: 'Unidentified'});
    }
};

let autoReplyDebounce = null;


// Live speech from the microphone. The app sends the whole utterance so far, again and again, as it is heard.
// It shows in the pill as it comes; after a 2-second pause the new words become the partner's message in the
// chat history (which also asks the AI for suggested replies). Only words not already added are added.
let transcriptCommitted = '';  // the part of the current utterance already in the chat history
let transcriptTimer = null;
window.receiveTranscript = function(text) {
    text = String(text || '');
    if (transcriptCommitted && !text.startsWith(transcriptCommitted)) transcriptCommitted = ''; // a new recognition run
    const fresh = text.slice(transcriptCommitted.length).trim();
    window.currentPartnerTranscript = fresh;
    let pill = document.getElementById('liveTranscriptPill');
    if(pill) {
        if(fresh.length > 0) {
            pill.innerText = "💬 " + fresh;
            pill.style.display = 'block';
        } else {
            pill.style.display = 'none';
        }
    }
    clearTimeout(transcriptTimer);
    if (fresh) transcriptTimer = setTimeout(() => {
        transcriptCommitted = text;
        if (typeof appendToChatHistory === 'function') appendToChatHistory(fresh, true);
    }, 2000);
};

window.receiveAutoReplies = function(repliesString) {
    if (repliesString.startsWith("Error:")) {
        console.error(repliesString);
        // Don't leave the "Predicting phrases..." placeholder stuck when the app has no AI to answer
        document.querySelectorAll('#messagesList .ai-injected-reply').forEach(el => el.remove());
        return;
    }
    
    let options = extractAIOptions(repliesString);
    if(options.length === 0) return;
    
    let msgList = document.getElementById('messagesList');
    if(!msgList) return;
    
    // Remove any previously injected AI replies so they don't pile up endlessly
    let oldReplies = msgList.querySelectorAll('.ai-injected-reply');
    oldReplies.forEach(el => el.remove());

    // Inject new replies at the top of the list, looking exactly like normal phrases
    // We use a distinct emoji (like a spark or robot) so the user knows it's AI
    for(let i = options.length - 1; i >= 0; i--) {
        let text = options[i];
        let li = document.createElement('li');
        li.className = "ai-injected-reply demo-no-swipe demo-no-reorder"; 
        li.dataset.bools = "fixed no-edit"; // Prevent editing via the menu
        
        // Exact same HTML structure as makeLiText()
        li.innerHTML = "<span style='font-size:3.3vh;'>🧠</span> &#8201 " + text;
        
        // Custom click handler to bypass Slip.js array index logic (so we don't corrupt the phrase bank)
        li.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation(); // Stop Slip.js from seeing this click
            let theTextEl = document.getElementById('theText');
            if(theTextEl) {
                theTextEl.value = text + " ";
                theTextEl.focus();
                // trigger input event so UI updates
                if(typeof theTextEl.oninput === 'function') theTextEl.oninput({stopPropagation: () => {}, key: 'Unidentified'});
            }
        };
        
        // Prepend to the top of the list
        msgList.insertBefore(li, msgList.firstChild);
    }
};

window.requestContextualPhrases = function() {
    let historyStr = "";
    if(window.rollingChatHistory && window.rollingChatHistory.length > 0) {
        historyStr = window.rollingChatHistory.map(h => `${h.role}: ${h.text}`).join(" | ");
    } else {
        historyStr = "No previous context.";
    }
    
    // Clear the floating pill if it was showing a transcript
    let pill = document.getElementById('liveTranscriptPill');
    if(pill) pill.style.display = 'none';
    window.currentPartnerTranscript = "";
    
    // Add visual loading indicator so user knows AI is working
    let msgList = document.getElementById('messagesList');
    if(msgList) {
        let oldReplies = msgList.querySelectorAll('.ai-injected-reply');
        oldReplies.forEach(el => el.remove());
        let li = document.createElement('li');
        li.className = "ai-injected-reply demo-no-swipe demo-no-reorder"; 
        li.dataset.bools = "fixed no-edit";
        li.innerHTML = "<span style='font-size:3.3vh;'>⏳</span> &#8201 Predicting phrases...";
        msgList.insertBefore(li, msgList.firstChild);
    }
    
    let msg = "ContextualPhrases:" + historyStr;
    let fp = typeof getFullPersona === 'function' ? getFullPersona() : "";
    if(fp.length > 0) msg += "||" + fp;
    
    if(typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
        window.webkit.messageHandlers.TexCom.postMessage({"m": msg});
    } else if (typeof doingSAPI !== 'undefined' && doingSAPI && window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage(msg);
    } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
        window.AndroidTexCom.postMessage(JSON.stringify({"m": msg}));
    } else {
        // Fallback for Web Mode
        if(typeof receiveAutoReplies === 'function') {
            receiveAutoReplies("I agree.|Tell me more.|That sounds good.");
        }
    }
};

window.expandTextWithLLM = expandTextWithLLM;
function expandTextWithLLM() {
    if(!params.llmExpansion || !window.deviceSupportsAI) return; // no AI in a browser: "@" is just a character
    
    let shorthand = theText.value;
    if(shorthand.endsWith("@")) {
        shorthand = shorthand.slice(0, -1).trim();
    }
    if(shorthand.length > 0) {
        let msg = "Expand:" + shorthand;
        if(typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
            window.webkit.messageHandlers.TexCom.postMessage({"m": msg});
        } else if (typeof doingSAPI !== 'undefined' && doingSAPI && window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage(msg);
        } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
            window.AndroidTexCom.postMessage(JSON.stringify({"m": msg}));
        }
        
        if(typeof Notiflix !== 'undefined' && Notiflix.Loading) {
            Notiflix.Loading.pulse('Expanding...');
        }
    }
}

let textPredictDebounce = null;

window.receivePredictions = function(predsString) {
    let box = document.getElementById('aiPredictionBox');
    if(!box) return;
    
    if (predsString.startsWith("Error:")) {
        box.style.display = 'none';
        return;
    }
    
    let options = extractAIOptions(predsString);
    if(options.length === 0) {
        box.style.display = 'none';
        return;
    }
    
    box.style.display = 'flex';
    let btns = box.getElementsByClassName('ai-predict-btn');
    for(let i=0; i<btns.length; i++) {
        if(options[i]) {
            btns[i].style.display = 'block';
            btns[i].innerText = options[i];
            btns[i].onclick = function() {
                if(theText) {
                    // Predictions are the NEXT words, so add them (this used to replace the last word typed)
                    let current = theText.value.replace(/\s+$/, '');
                    theText.value = (current.length ? current + " " : "") + options[i] + " ";
                    box.style.display = 'none';
                    // Trigger the next prediction request so they can chain words
                    if(typeof theText.oninput === 'function') {
                        theText.oninput({stopPropagation: () => {}, key: 'Unidentified'});
                    } else {
                        // Fallback trigger
                        let msg = "PredictNextWords:" + theText.value;
                        let fp = getFullPersona();
                        if(fp.length > 0) msg += "||" + fp;
                        if(typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
                            window.webkit.messageHandlers.TexCom.postMessage({"m": msg});
                        } else if (typeof doingSAPI !== 'undefined' && doingSAPI && window.chrome && window.chrome.webview) {
                            window.chrome.webview.postMessage(msg);
                        } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
                            window.AndroidTexCom.postMessage(JSON.stringify({"m": msg}));
                        }
                    }
                    theText.focus();
                    theText.selectionStart = theText.value.length;
                    theText.selectionEnd = theText.value.length;
                }
            };
        } else {
            btns[i].style.display = 'none';
        }
    }
};

    theText.oninput = function(e) {
        // The text box is the search (no Search box): refilter on any change, not just key-up, so paste,
        // dictation, predictive-text taps and keyboards that send no key-up also filter the phrases
        clearTimeout(tmrKeys);
        tmrKeys = setTimeout(doPredict, 200);
        clearTimeout(textPredictDebounce);
        let box = document.getElementById('aiPredictionBox');
        if(box) box.style.display = 'none';
        
        let currentText = theText.value;
        
        // Android Virtual Keyboard (keyCode 229) safe traps
        if (currentText.endsWith("@")) {
            expandTextWithLLM();
            return;
        }
        if (currentText.endsWith("^")) {
            theText.value = currentText.slice(0, -1);
            requestContextualPhrases();
            return;
        }
        if (currentText.endsWith("/")) {
            let s = currentText.substr(0, currentText.length - 1).toLowerCase();
            let result = s.lastIndexOf(" ");
            if (result > 0)
                s = s.substr(result + 1);
            if (s.length > 0) {
                for (let i = 0; i < manifestInfo.messages.length; i++) {
                    if (s == manifestInfo.messages[i].abbreviation.trim().toLowerCase()) {
                        let tmpS = manifestInfo.messages[i].name;
                        if (tmpS.includes("[***]"))
                            tmpS = tmpS.replace("[***]", params.UserName);
                        theText.value = theText.value.substr(0, theText.value.length - s.length - 1) + tmpS + " ";
                        console.log(manifestInfo.messages[i].name);
                        break;
                    }
                }
            }
        }
        
        currentText = currentText.trim();
        if(currentText.length === 0) return;
        
        textPredictDebounce = setTimeout(function() {
            let msg = "PredictNextWords:" + currentText;
            let fp = getFullPersona();
            if(fp.length > 0) {
                msg += "||" + fp;
            }
            if(typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
                window.webkit.messageHandlers.TexCom.postMessage({"m": msg});
            } else if (typeof doingSAPI !== 'undefined' && doingSAPI && window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(msg);
            } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
                window.AndroidTexCom.postMessage(JSON.stringify({"m": msg}));
            }
        }, 500); // 500ms debounce
    };

    theText.onkeyup = function (e) {
        e.stopPropagation();
        if (e.key == "Control") {
            btnFlip.hidden = true;
        }
        stopSearch = true;
        clearTimeout(tmrKeys);
        tmrKeys = setTimeout(function () {
            doPredict();
        }, 200);
        theText.scrollTop = theText.scrollHeight;
    }
    window.addEventListener("resize", windowResized);
    window.addEventListener("orientationchange", (event) => {
            switch (window.orientation) {
                case -90:
                case 180:
                    btnFlip.innerHTML = theText.value;
                    btnFlip.hidden = false;
                    break;
                default:
                    btnFlip.hidden = true;
                    break;
            }
    });

    loadParams();
    setInterval(function () {
        uploadButton.disabled = (theText.value.length == 0); // Share sends the typed text
    }, 300);
    
    if (doingSAPI) {
        window.chrome.webview.addEventListener('message', arg => {
            SAPInames = arg.data.toString();
        });
        window.chrome.webview.postMessage("GetVoices");
    }
    else if (webViewIOS) { // send getvoices message and get them back in previous function
        var message = "GetVoices";
        window.webkit.messageHandlers.TexCom.postMessage({
                "m": message
            });
    }

    //    document.onkeydown = function (e) {
    //        if (e.key == "Control") {
    //            btnFlip.value = theText.value;
    //            btnFlip.hidden = false;
    //        }
    //    }
    //    document.onkeyup = function (e) {
    //        if (e.key == "Control") {
    //            btnFlip.hidden = true;
    //        }
    //    }
}

function doPredict() {
    stopSearch = false;
    let s = theText.value;
    autoPredict = s.lastIndexOf(".");
    let result2 = s.lastIndexOf("?");
    if (result2 > autoPredict)
        autoPredict = result2;
    result2 = s.lastIndexOf("!");
    if (result2 > autoPredict)
        autoPredict = result2;
    result2 = s.lastIndexOf(",");
    if (result2 > autoPredict)
        autoPredict = result2;
    result2 = s.lastIndexOf(":");
    if (result2 > autoPredict)
        autoPredict = result2;
    result2 = s.lastIndexOf(";");
    if (result2 > autoPredict)
        autoPredict = result2;
    if (s.substr(autoPredict, 1) == '"')
        result++;
    autoPredict++;
    filter.value = filterPredict = s.substr(autoPredict).trim();
    updateList();
}

// (B) ATTACH KEY UP LISTENER TO SEARCH BOX
if(window.filter) {
    // Typing in the Search box: filter on its text (and don't strip anything from the text box on a phrase tap)
    const onSearch = () => { filterPredict = ""; updateList(); };
    window.filter.onkeyup = onSearch;
    window.filter.oninput = onSearch; // on-screen keyboards don't always send keyup
}

var stopSearch = false;
async function updateList() {
    // stopSearch = true;
    // await timer(20); // allow interupting of typing
    setTimeout(function () {
        updateList2();
    }, 50);
}

async function updateWithCategory() {
    updateList2();
}

// Highlight the current category row (two-column mode has no heading showing it)
function markSelectedCategory() {
    for (const li of categoryList.children) {
        const name = li.innerText.substr(li.innerText.indexOf(' ')).trim();
        const selected = (name == categoryName);
        li.classList.toggle('selected', selected);
        li.setAttribute('aria-selected', selected ? 'true' : 'false');
    }
}

async function updateList2() {
    markSelectedCategory();
    // Typing in the text box puts its last fragment into the filter (doPredict)
    let search = (filter.value || '').trim().toLowerCase();
    const info = document.getElementById('filterInfo');
    if (info) {
        info.hidden = !search;
        document.getElementById('filterInfoText').textContent = search ? 'Matching “' + filter.value.trim() + '”' : '';
    }
    if (true) { //!smallPortrait || categoryList.hidden) {
        let children = [...theList.children];
        for (let i = 0; i < children.length; i++) {
            children[i].style.display = 'none';
        }
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child.classList.contains('ed-add')) { child.style.display = ''; continue; } // always show "+ Add phrase"
            let item = child.innerText.toLowerCase(); 
            if (item.indexOf(search) == -1 || checkCategory(child, i)) {
                 child.style.display = 'none';
            } else {
                 child.style.display = '';
            }
            if (stopSearch) {
                return;
            }
        }
        // Nothing matches: say so on the Matching line (an empty list looked like missing phrases)
        if (search && info) {
            const any = children.some(c => c.style.display !== 'none' && !c.classList.contains('ed-add') && !c.classList.contains('ai-injected-reply'));
            document.getElementById('filterInfoText').textContent = (any ? 'Matching “' : 'No phrases match “') + filter.value.trim() + '”';
        }
    } else { // don't search categories currently
        let children = [...categoryList.children];
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            let item = child.innerText.toLowerCase();
            if (item.indexOf(search) == -1) {
                child.classList.add("hide");
            } else {
                child.classList.remove("hide");
            }
            if (i % 100 == 0)
                await timer(1);
            if (stopSearch) {
                return;
            }
        }
    }
}

function checkCategory(child, index) {
    if(child && child.classList.contains("ai-injected-reply")) return false; // Never hide AI replies due to category
    // find the actual index in manifestInfo
    let i = index - document.querySelectorAll("#messagesList .ai-injected-reply, #messagesList .ed-add").length;
    if (i < 0 || i >= manifestInfo.messages.length) return false;

    if (categoryName == "All")
        return false;
    else if (manifestInfo.messages[i].categories.includes("[" + categoryName + "]"))
        return false;
    return true;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// Starter Favourites (also tagged in TexCom.json). Saved phrase sets from before these existed get them once,
// only if their Favourites are empty; a list someone has built, or emptied since, is never touched.
const DEFAULT_FAVOURITES = ["Hello", "How are you?", "Thank you.", "Please.", "Just a minute.", "I don't understand.",
    "I need help now.", "I'm in pain.", "I'm thirsty.", "See you later."];
function seedFavourites(info) {
    try {
        if (localStorage.getItem('texcomFavouritesSeeded')) return;
        localStorage.setItem('texcomFavouritesSeeded', '1');
        if (!info || !Array.isArray(info.messages) || info.messages.some(m => (m.categories || '').includes('[Favourites]'))) return;
        let added = 0;
        DEFAULT_FAVOURITES.forEach(name => {
            const m = info.messages.find(x => x.name.trim() === name);
            if (m) { m.categories = (m.categories || '') + '[Favourites]'; added++; }
        });
        if (added) localStorage.setItem("JsonTex", JSON.stringify(info));
    } catch (e) {}
}

async function loadManifest() {
    try {
        let txtcom = localStorage.getItem("JsonTex");
        manifestInfo = JSON.parse(txtcom);
        if (txtcom.length > 100) {
            seedFavourites(manifestInfo);
            processManifest();
            setTimeout(() => { if (typeof checkForNewPhrases === 'function') checkForNewPhrases(); }, 2500);
        }
        return;
    } catch (e) {}
    currentCommunicatorName = 'TexCom.json';
    let myObject = await fetch(currentCommunicatorName);
    let myText = await myObject.text();
    manifestInfo = JSON.parse(myText);
    processManifest();
    return;
    for (let i = 0; i < 2; i++) {
        targetIndex = i;
        doingCategories = true;
        let li = document.createElement('li')
        li.className = "demo-no-reorder"; //"demo-no-swipe demo-no-reorder";
        //            li.innerHTML = "🟩 &#8201" + "<span style=color:#f30f0f>" + s + "</span>" + "<span class='quick'></span > ";
        li.innerHTML = makeLiText(); //"▫️" + " &#8201" + s + "<span class='quick'></span > ";
        li.dataset.bools = "fixed no-edit"; // use for parameters

        categoryList.appendChild(li);
        //            console.log("Category: ", s);
        currentCategory = categories.length - 1;
    }
}

function arrayMove(arr, fromIndex, toIndex) { // for dragging arrays around 
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

window.addEventListener("orientationchange", function () {
    windowResized();
}, false);

function removeEmoji(s) {
    s.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
    return s;
}

function windowResized() {
    //    var layoutViewport = document.getElementById('layoutViewport');
    smallPortrait = isOneColumnLayout();
    try {
        if (smallPortrait) {
            gui.width = window.innerWidth * .74;
        } else {
            gui.width = window.innerWidth * .35;
        }
    } catch (e) {}
    try {
        let isLargeLandscape = !smallPortrait;
    if (smallPortrait || !isLargeLandscape) {

        // Reset theText and AI elements to fallback to CSS defaults
        let theTextEl = document.getElementById('theText');
//         if (theTextEl) { theTextEl.style.width = ""; theTextEl.style.left = ""; }
        let chatHist = document.getElementById('chatHistoryContainer');
//         if (chatHist) { chatHist.style.width = ""; chatHist.style.left = ""; }
        let aiPred = document.getElementById('aiPredictionBox');
//         if (aiPred) { aiPred.style.width = ""; aiPred.style.left = ""; }
//         if (aiAuto) { aiAuto.style.width = ""; aiAuto.style.left = ""; }
        theCatBtn = document.getElementById('theCategories');
//         if (theCatBtn) { theCatBtn.style.width = ""; theCatBtn.style.left = ""; }
        let btnFlipEl = document.getElementById('flip');
        if (btnFlipEl) { btnFlipEl.style.left = ""; }
    }
    
    if (isLargeLandscape) {
        // Enforce split-brain visibility (both are always visible if appropriate)
        theCatBtn = document.getElementById('theCategories');
//         if(theCatBtn) { theCatBtn.style.display = 'block'; }
        let msgList = document.getElementById('messagesList');
        if(msgList) { msgList.style.display = 'block'; }
        // Categories are always shown in two columns (portrait may have collapsed them)
        categoryList.hidden = false;

        // SPLIT-BRAIN LAYOUT for iPad / Large Screens
        // Top buttons can stay roughly where they are in landscape (or span 100vw)
        
        buttonPanel.style.width = "100vw";
        titleLbl.style.width = "100vw";
        closeButton.style.left = "95vw";
        txtText.style.width = "90vw";
        btnTxtCol.style.width = "20vw";
        btnTxtCol.style.left = "80vw";
        lblRecording.style.width = "96vw";
        btnPlay.style.width = "10vw";
        btnRecSnd.style.width = "10vw";
        btnRecSnd.style.left = "15vw ";
        btnStopRec.style.width = "10vw";
        btnStopRec.style.left = "30vw";
        btnDeleteSnd.style.width = "10vw";
        btnDeleteSnd.style.left = "45vw";
        btnLoadSnd.style.width = "10vw";
        btnLoadSnd.style.left = "60vw";
        checkList.style.width = "24vw";
        checkList.style.left = "34vw";
        lblCategories.style.width = "23vw";
        lblCategories.style.left = "34vw";
        
        splash.style.backgroundImage = "url('images/splash.jpg')";
        
        // --- Split Brain Layout ---
        // Right Pane (Message Bank)
        theCatBtn = document.getElementById('theCategories');
        if (theCatBtn) { 
//             theCatBtn.style.width = "49vw"; 
//             theCatBtn.style.left = "50vw"; 
            if(categoryList.hidden) {
                theCatBtn.innerHTML = "Categories: " + categoryName + " ⏩";
            } else {
                theCatBtn.innerHTML = "Categories: " + categoryName + "  🔼";
            }
        }
        
//         categoryList.style.width = "50vw";
//         categoryList.style.left = "50vw";
//         theList.style.width = "50vw";
//         theList.style.left = "50vw";
//         filter.style.left = "50vw";
//         filter.style.width = "49vw";
        
        // Left Pane (AI & Text)
        let theTextEl = document.getElementById('theText');
        if (theTextEl) {
//             theTextEl.style.width = "48vw";
//             theTextEl.style.left = "1vw";
        }
        let chatHist = document.getElementById('chatHistoryContainer');
        if (chatHist) {
//             chatHist.style.width = "48vw";
//             chatHist.style.left = "1vw";
        }
        let aiPred = document.getElementById('aiPredictionBox');
        if (aiPred) {
//             aiPred.style.width = "48vw";
//             aiPred.style.left = "1vw";
        }
        if (aiAuto) {
//             aiAuto.style.width = "48vw";
//             aiAuto.style.left = "1vw";
        }
        let btnFlipEl = document.getElementById('flip');
        if (btnFlipEl) { btnFlipEl.style.left = "45vw"; }
        
        // Spread the top buttons across 100vw
        
//         texcomButton.style.left = "38vw";
//         texcomButton.style.width = "10vw";
//         texcomButton.style.backgroundSize = "9vw 5vh";
        
    } else if (smallPortrait) {
        buttonPanel.style.width = "92vw";
            titleLbl.style.width = "92vw";
            closeButton.style.left = "87.25vw";
            txtText.style.width = "82vw";
            btnTxtCol.style.width = "20vw";
            btnTxtCol.style.left = "70vw";
            lblRecording.style.width = "87vw";
            btnPlay.style.width = "15vw";
            btnRecSnd.style.width = "15vw";
            btnRecSnd.style.left = "21.5vw";
            btnStopRec.style.width = "15vw";
            btnStopRec.style.left = "38.5vw";
            btnDeleteSnd.style.width = "15vw";
            btnDeleteSnd.style.left = "55.5vw";
            btnLoadSnd.style.width = "15vw";
            btnLoadSnd.style.left = "72.5vw";
            checkList.style.width = "39vw";
            checkList.style.left = "50vw";
            lblCategories.style.width = "38vw";
            lblCategories.style.left = "50vw";

            splash.style.backgroundImage = "url('images/TexCom Portrait.jpg')";
//             //        theCategoriesButton.style.width = "100vw";
            categoryList.hidden = true;
//             categoryList.style.width = "100vw";
//             theList.style.left = "0vw";
//             theList.style.width = "100vw";
//             filter.style.left = "0vw";
//             filter.style.width = "100vw";

            
//             texcomButton.style.left = "51.25vw";
//             texcomButton.style.width = "0vw";
//             texcomButton.style.backgroundSize = "6.5vw 5vh";

        } else {
            buttonPanel.style.width = "60vw";
            titleLbl.style.width = "60vw";
            closeButton.style.left = "55.25vw";
            txtText.style.width = "52vw";
            btnTxtCol.style.width = "13vw";
            btnTxtCol.style.left = "46vw";
            lblRecording.style.width = "56vw";
            btnPlay.style.width = "8vw";
            btnRecSnd.style.width = "8vw";
            btnRecSnd.style.left = "15vw ";
            btnStopRec.style.width = "8vw";
            btnStopRec.style.left = "26vw";
            btnDeleteSnd.style.width = "8vw";
            btnDeleteSnd.style.left = "37vw";
            btnLoadSnd.style.width = "8vw";
            btnLoadSnd.style.left = "48vw";
            checkList.style.width = "24vw";
            checkList.style.left = "34vw";
            lblCategories.style.width = "23vw";
            lblCategories.style.left = "34vw";

            splash.style.backgroundImage = "url('images/splash.jpg')";
//             //        theCategoriesButton.style.width = "50vw";
            if (freeVersion) {
//                 theList.style.left = "0vw";
//                 theList.style.width = "100vw";
                categoryList.hidden = true;
            }
            else {
//             categoryList.style.width = "30vw";
//             theList.style.left = "30vw";
//             theList.style.width = "70vw";
            categoryList.hidden = false;
            }
//             filter.style.left = "30vw";
//             filter.style.width = "70vw";

            
//             texcomButton.style.left = "40.25vw";
//             texcomButton.style.width = "19.5vw";
//             texcomButton.style.backgroundSize = "19.5vw 5vh";
        }
    } catch (e) {}
    updateCategoriesButton();
}


function setupSlip(list) {
    list.addEventListener('slip:swipe', function (e) {
        lastMessageClicked = -1;
        openItemEditorForLi(e.target); // editor.js
        e.preventDefault();
    }, false);

    list.addEventListener('slip:tap', function (e) {
        if (window.pencilTapped) { window.pencilTapped = false; return false; } // editor.js pencil
        if (e.target.classList.contains('ed-add')) { openNewItem(e.target.dataset.kind); return false; }
        target = e.target;
        if (e.target.innerHTML.length < 5) // clicked on emoji
            return;
        targetIndex = listItemIndex(e.target);
        lastMessageClicked = targetIndex;
        mute();
        console.log("Right button: ", rightButton);
        doingCategories = false;
        if (!rightButton) {
            filter.value = "";
            if (e.currentTarget.id == "messagesList") {
                console.log("Message: " + target.innerText);
                pushHistory();
                let tmpS = e.target.innerText.substr(e.target.innerText.indexOf(' ')).trim() + " ";
                if (tmpS.includes("[***]"))
                    tmpS = tmpS.replace("[***]", params.UserName);
                let tmpStart = tmpS.indexOf("[:");
                if (tmpStart != -1) {
                    tmpS = tmpS.trim();
                    let ctg = tmpS.substr(tmpStart + 2, tmpS.length - 3);
                    ctg = ctg.replace("]", "");
                    categoryName = ctg;
                    theCategoriesButton.innerHTML = "Categories: " + categoryName + "  ⏩";
                    updateWithCategory();
                    tmpS = tmpS.substr(0, tmpStart).trim()
                }
                // Instant message: speak straight away instead of adding it to the text box
                const tappedItem = manifestInfo.messages[targetIndex];
                if (tappedItem && (tappedItem.instant === true || tappedItem.instant === 'true')) {
                    if (tmpS.trim().length > 0) speak(tmpS.trim());
                    return false;
                }
                if (filterPredict.length > 0)
                    theText.value = theText.value.substr(0, theText.value.length - filterPredict.length).trim();
                if (theText.value.length == 0)
                    theText.value = tmpS;
                else
                    theText.value += " " + tmpS;
                // filter.value = "";
                filterPredict = "";
                updateList();
                theText.focus();
            } else {
                let isLargeLandscape = !smallPortrait;
                if (smallPortrait)
                    categoryList.hidden = true;
                const tmp = e.target.innerText.substr(e.target.innerText.indexOf(' ')).trim();
                categoryName = tmp;
                theCategoriesButton.innerHTML = "Categories: " + categoryName + "  ⏩";
                updateWithCategory();
            }
        } else {
            //            alert("Write code to Edit entry");
            if (e.currentTarget.id == "messagesList")
                doMenu(e);
            else { // no menu for first two
                doingCategories = true;
                let children = [...categoryList.children];
                if (e.target.innerText != categoryList.children[0].innerText && e.target.innerText != categoryList.children[1].innerText)
                    doMenu(e);
            }
        }
        return false;
    }, false);

    list.addEventListener('slip:beforereorder', function (e) {
        // Reordering is an Edit-mode action (every row carries demo-no-reorder, so this used to block it always)
        const li = e.target.closest('li'); // the event can come from the drag handle inside the row
        if (!li || !isEditing() || isSpecialRow(li)) { e.preventDefault(); return; }
        const idx = listItemIndex(li);
        const items = li.parentElement.id == 'messagesList' ? manifestInfo.messages : manifestInfo.categories;
        if ((li.parentElement.id != 'messagesList' && idx < 2) || (items[idx] && items[idx].fixed)) e.preventDefault();
    }, false);

    list.addEventListener('slip:beforeswipe', function (e) {
        if (e.target.nodeName == 'INPUT' || e.target.classList.contains('demo-no-swipe')) {
            e.preventDefault();
        }
    }, false);

    list.addEventListener('slip:beforewait', function (e) {
        if (e.target.classList.contains('quick')) e.preventDefault();
    }, false);

    list.addEventListener('slip:afterswipe', function (e) {
        //        e.preventDefault();
        e.target.parentNode.appendChild(e.target);
    }, false);

    list.addEventListener('slip:reorder', function (e) {
        const li = e.target.closest('li');
        const specials = [...li.parentElement.children].filter(isSpecialRow).length; // always at the top
        targetIndex = listItemIndex(li);
        const toIndex = e.detail.spliceIndex - specials;
        if (toIndex < 0) return false;
        e.detail.spliceIndex = toIndex;
        if (e.currentTarget.id != "messagesList") {
            if (e.detail.spliceIndex >= 2 && targetIndex >= 2) { // keep All and Favourites at top
                arrayMove(manifestInfo.categories,targetIndex, e.detail.spliceIndex);
                li.parentNode.insertBefore(li, e.detail.insertBefore);
                saveToLocalStorage();
            }
            else
                return false;
        }
        else { 
            arrayMove(manifestInfo.messages,targetIndex, e.detail.spliceIndex);
            li.parentNode.insertBefore(li, e.detail.insertBefore);
            saveToLocalStorage();
        }
        lastMessageClicked = -1;
        return false;
    }, false);

    return new Slip(list);
}

async function doMenu(e) {
    let listName = e.currentTarget.id;
    posX = Math.min(posX, window.innerWidth - 150);
    posY = Math.min(posY, window.innerHeight - 100);
    const position = await PopupMenuPosition.alignAt(e.target, posX, posY);

    // Align PopupMenu position to the bottom left of the button
    // Show PopupMenu and wait for the selected menu id asynchronously

    let selectedId;
    if (target) {
        if (doingCategories) {
            if (manifestInfo.categories[targetIndex].deletable)
                selectedId = await PopupMenu.show(itemList, position);
            else
                selectedId = await PopupMenu.show(itemListNoDelete, position);
        } else {
            if (manifestInfo.messages[targetIndex].deletable)
                selectedId = await PopupMenu.show(itemList, position);
            else
                selectedId = await PopupMenu.show(itemListNoDelete, position);
        }
    }

    if (selectedId) {
        switch (itemList.find(item => item.itemId ==
            selectedId).itemName) {
            case "Edit":
                openItemEditorForLi(target);
                break;
            case "Add new entry":
                if (!doingCategories) {
                    manifestInfo.messages.splice(targetIndex, 0, {
                        name: "Blank",
                        emoji: "▫️",
                        colour: "#000000",
                        deletable: true,
                        fixed: false,
                        abbreviation: " ",
                        instant: false,
                        categories: "[" + manifestInfo.categories[2].name + "]",
                        gotaudio: false,
                        audioData: "",
                    });
                    manifestInfo.lastMessageId = manifestInfo.messages.length;
                    let li = document.createElement('li')
                    li.className = "demo-no-reorder";
                    li.innerHTML = makeLiText();
                    li.dataset.bools = "fixed no-edit";
                    theList.insertBefore(li, theList.children[targetIndex]);
function getFullPersona() {
    let p = [];
    if(params.personaPronouns && params.personaPronouns !== 'Not Specified') p.push("Pronouns: " + params.personaPronouns);
    if(params.personaTone) p.push("Tone: " + params.personaTone);
    if(params.personaFormality) p.push("Formality: " + params.personaFormality);
    
    if(params.personaDisability && params.personaDisability !== 'Prefer not to say') {
        p.push("Disability / Condition: " + params.personaDisability);
    }
    
    if(params.personaDisclosure) {
        if(params.personaDisclosure === 'Brief (Mention AAC if asked)') p.push("Disability Context: Mention you use an AAC device if asked");
        else if(params.personaDisclosure === 'Prefer not to say (Decline to answer)') p.push("Disability Context: If asked about your disability or device, politely but firmly decline to answer and say you prefer not to discuss it.");
        else if(params.personaDisclosure === 'Informative (Explain AAC)') p.push("Disability Context: Be open and informative about using an AAC device");
        else if(params.personaDisclosure === 'Humorous') p.push("Disability Context: Make lighthearted jokes about using a robot voice/AAC device");
        else p.push("Disability Context: Private (Do not mention disability or AAC)");
    }
    
    if(params.personaHearing) {
        if(params.personaHearing === 'Deaf (Ask to speak to device)') p.push("Hearing Status: You are Deaf. Ask the partner to speak clearly into the device so it can transcribe their words for you to read, or ask them to type on the Companion App/Bluetooth Keyboard.");
        else if(params.personaHearing === 'Hard of Hearing (Ask to speak clearly)') p.push("Hearing Status: You are Hard of Hearing. Ask the partner to speak clearly and loudly into the device so it can transcribe their words.");
    }
    
    if(params.userPersona && params.userPersona.trim().length > 0) p.push("Custom Details: " + params.userPersona.trim());
    
    // Inject Rolling Chat History Context for better AI awareness
    if (window.rollingChatHistory && window.rollingChatHistory.length > 0) {
        let hist = window.rollingChatHistory.map(m => m.role + ": " + m.text).join(" | ");
        p.push("Recent Conversation Context: [" + hist + "]");
    }
    
    return p.join(", ");
}

                } else { // categories
                    manifestInfo.categories.splice(targetIndex, 0, {
                        name: "Blank",
                        emoji: "▫️",
                        colour: "#000000",
                        deletable: true,
                        fixed: false
                    });

                    let li = document.createElement('li')
                    li.className = "demo-no-reorder";
                    li.innerHTML = makeLiText();
                    li.dataset.bools = "fixed no-edit";
                    categoryList.insertBefore(li, categoryList.children[targetIndex]);
                }
                break;
            case "Delete":
                if (doingCategories) {
                    manifestInfo.categories.splice(targetIndex, 1);
                } else {
                    manifestInfo.messages.splice(targetIndex, 1);
                }
                e.target.remove();
                saveToLocalStorage();
                break;
        }
        //        alert(`You have selected: ${itemList.find(item => item.itemId
        //            == selectedId).itemName}`);
    }
}

const timer = ms => new Promise(res => setTimeout(res, ms))

// --- CONVERSATION MODE ---
// The panel is only a view: the AI always keeps the recent conversation (rollingChatHistory) for its suggestions.
// Settings > AI > "Show chat history" (params.chatInterface, off by default) shows or hides it.
window.toggleChatInterface = function(isEnabled) {
    let container = document.getElementById('chatHistoryContainer');
    let divider = document.getElementById('chatDivider');
    if(!container) return;
    const show = isEnabled && window.rollingChatHistory && window.rollingChatHistory.length > 0;
    if(show) {
        // Show the conversation so far, including anything said while the panel was hidden
        container.innerHTML = '';
        window.rollingChatHistory.forEach(m => container.appendChild(makeChatBubble(m.text, m.role === 'Partner')));
    }
    container.hidden = !show;
    if(divider) divider.hidden = !show;
    if(show) { applyChatHeight(); scrollChatToEnd(); }
};

function makeChatBubble(text, isPartner) {
    let bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (isPartner ? 'partner' : 'me');
    bubble.innerText = text;
    return bubble;
}

function scrollChatToEnd() {
    let container = document.getElementById('chatHistoryContainer');
    if(container) container.scrollTop = container.scrollHeight;
}

// The height the chat is a fraction of: the left column, or on upright phones (one column) 60% of the screen
function chatReferenceHeight() {
    if(document.documentElement.classList.contains('layout-one')) return window.innerHeight * 0.6;
    const pane = document.getElementById('leftPane');
    return pane ? pane.clientHeight : window.innerHeight;
}

// Height after the divider is dragged: a fraction of the left column (chat 15%-70%), or none = fit the messages
function applyChatHeight() {
    let container = document.getElementById('chatHistoryContainer');
    let pane = document.getElementById('leftPane');
    if(!container || !pane) return;
    const f = params && typeof params.chatPaneFraction === 'number' ? params.chatPaneFraction : null;
    if(f == null) { container.classList.remove('sized'); return; }
    const clamped = Math.min(Math.max(f, 0.15), 0.7);
    container.style.setProperty('--chat-height', Math.round(clamped * chatReferenceHeight()) + 'px');
    container.classList.add('sized');
}

window.rollingChatHistory = [];
window.appendToChatHistory = function(text, isPartner) {
    window.rollingChatHistory.push({text: text, role: isPartner ? 'Partner' : 'User'});
    if(window.rollingChatHistory.length > 20) window.rollingChatHistory.shift();
    
    // Trigger contextual phrase generation ANY time history updates, regardless of UI state
    if(typeof window.requestContextualPhrases === 'function') {
        window.requestContextualPhrases();
    }
    
    if(!params || !(typeof chatShouldShow === 'function' ? chatShouldShow() : params.chatInterface)) return;
    let container = document.getElementById('chatHistoryContainer');
    if(!container) return;
    if(container.hidden) { toggleChatInterface(true); return; } // first message: shows the whole history
    container.appendChild(makeChatBubble(text, isPartner));
    
    // Prevent DOM memory leaks during long conversations (cap at 100 messages)
    while(container.children.length > 100) {
        container.removeChild(container.firstChild);
    }
    scrollChatToEnd();
};

// Divider between the categories and the chat history: drag (mouse or touch) or arrow keys; saved
document.addEventListener('DOMContentLoaded', function () {
    const divider = document.getElementById('chatDivider');
    const container = document.getElementById('chatHistoryContainer');
    const pane = document.getElementById('leftPane');
    if(!divider || !container || !pane) return;
    let dragging = false;
    function setFromY(clientY) {
        let h;
        if(document.documentElement.classList.contains('layout-one')) {
            h = clientY - 6 - container.getBoundingClientRect().top; // divider below the chat: drag down to enlarge
        } else {
            h = pane.getBoundingClientRect().bottom - clientY - 6;   // divider above the chat: drag up to enlarge
        }
        params.chatPaneFraction = Math.min(Math.max(h / chatReferenceHeight(), 0.15), 0.7);
        applyChatHeight();
    }
    function save() { if(typeof saveParams === 'function') saveParams(); }
    divider.addEventListener('pointerdown', e => { dragging = true; divider.setPointerCapture(e.pointerId); e.preventDefault(); });
    divider.addEventListener('pointermove', e => { if(dragging) { setFromY(e.clientY); scrollChatToEnd(); } });
    divider.addEventListener('pointerup', () => { if(dragging) { dragging = false; save(); } });
    divider.addEventListener('pointercancel', () => { dragging = false; });
    divider.addEventListener('keydown', e => {
        if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        const current = container.getBoundingClientRect().height / chatReferenceHeight();
        const bigger = document.documentElement.classList.contains('layout-one') ? e.key === 'ArrowDown' : e.key === 'ArrowUp'; // towards the divider's far side
        params.chatPaneFraction = Math.min(Math.max(current + (bigger ? 0.05 : -0.05), 0.15), 0.7);
        applyChatHeight(); scrollChatToEnd(); save();
    });
    // Keep the newest message in view and the dragged height in proportion when the window changes
    new ResizeObserver(() => { if(!container.hidden) { applyChatHeight(); scrollChatToEnd(); } }).observe(document.querySelector('.main-layout') || pane);
});

// --- PARTNER KEYBOARD ---

// removed cruft
    // Check initial state
    setTimeout(() => {
        if(params.chatInterface) toggleChatInterface(true);
    }, 500);


// --- HEADLESS BLUETOOTH KEYBOARD ---
let partnerBuffer = "";
let partnerIsTyping = false;

window.addEventListener('keydown', function(e) {
    if (e.key === '`') {
        partnerIsTyping = true;
        partnerBuffer = "";
        e.preventDefault();
        e.stopPropagation();
        
        window.currentPartnerTranscript = "Partner is typing...";
        let pill = document.getElementById('liveTranscriptPill');
        if(pill) {
            pill.innerText = '💬 Partner is typing...';
            pill.style.display = 'block';
        }
        return;
    }
    
    if (partnerIsTyping) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.key === 'Enter') {
            partnerIsTyping = false;
            let finalMsg = partnerBuffer.trim();
            partnerBuffer = "";
            let pill = document.getElementById('liveTranscriptPill');
            if(pill) pill.style.display = 'none';
            
            // The partner's typed message: into the chat history, which also asks the AI for suggested replies
            // (it used to only flash in the pill, and the replies call checked for a function that doesn't exist)
            if(finalMsg.length > 0 && typeof appendToChatHistory === 'function') appendToChatHistory(finalMsg, true);
        } else if (e.key === 'Escape') {
            partnerIsTyping = false;
            partnerBuffer = "";
            let pill = document.getElementById('liveTranscriptPill');
            if(pill) pill.style.display = 'none';
        } else if (e.key === 'Backspace') {
            partnerBuffer = partnerBuffer.slice(0, -1);
            window.currentPartnerTranscript = partnerBuffer;
            let pill = document.getElementById('liveTranscriptPill');
            if(pill) {
                if(partnerBuffer.length > 0) {
                    pill.innerText = '💬 ' + partnerBuffer + ' |';
                    pill.style.display = 'block';
                } else {
                    pill.style.display = 'none';
                }
            }
        } else if (e.key.length === 1) {
            partnerBuffer += e.key;
            window.currentPartnerTranscript = partnerBuffer;
            let pill = document.getElementById('liveTranscriptPill');
            if(pill) {
                pill.innerText = '💬 ' + partnerBuffer + ' |';
                pill.style.display = 'block';
            }
        }
    }
}, true);
// Conversations with a partner over the internet: conversation.js

// --- AI INITIALIZATION ---
setTimeout(() => {
    // Send TTS parameters to bridge on boot
    if(params) {
        if(typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
            if(params.voiceName) window.webkit.messageHandlers.TexCom.postMessage({"m": "Voice:" + params.voiceName});
            window.webkit.messageHandlers.TexCom.postMessage({"m": "Pitch:" + params.voicePitch});
            window.webkit.messageHandlers.TexCom.postMessage({"m": "Speed:" + params.voiceRate});
            window.webkit.messageHandlers.TexCom.postMessage({"m": "Volume:" + params.voiceVolume});
        } else if (typeof doingSAPI !== 'undefined' && doingSAPI && window.chrome && window.chrome.webview) {
            if(params.voiceName) window.chrome.webview.postMessage("Voice:" + params.voiceName);
            window.chrome.webview.postMessage("Pitch:" + params.voicePitch);
            window.chrome.webview.postMessage("Speed:" + params.voiceRate);
            window.chrome.webview.postMessage("Volume:" + params.voiceVolume);
        } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
            if(params.voiceName) window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Voice:" + params.voiceName }));
            window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Pitch:" + params.voicePitch }));
            window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Speed:" + params.voiceRate }));
            window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Volume:" + params.voiceVolume }));
        }
        
        // Settings > Smart AI > "Start listening when TexCom opens"
        if(params.ambientListening) toggleAmbient(true);
    }
}, 1000);


// --- STEP 7: OS Keyboard Hardening ---
let isKeyboardActive = false;
let keyboardBaseline = { w: window.innerWidth, h: window.innerHeight }; // full height seen at this width
function handleKeyboardState() {
    // An on-screen keyboard is up only when a text field has focus AND the visible height has dropped well
    // below the full height seen at this width. Focus alone (desktop, hardware keyboard, unfolded
    // foldable) no longer counts. Comparing with the baseline also covers Android, where the keyboard
    // shrinks innerHeight itself, and iOS, where only visualViewport shrinks.
    const visibleHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (window.innerWidth !== keyboardBaseline.w) keyboardBaseline = { w: window.innerWidth, h: Math.max(window.innerHeight, visibleHeight) };
    else keyboardBaseline.h = Math.max(keyboardBaseline.h, window.innerHeight);
    const a = document.activeElement;
    const typing = !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /^(text|search|email|url|tel|number)$/i.test(a.type)));
    const currentlyActive = typing && visibleHeight < keyboardBaseline.h * 0.75;
    
    if (currentlyActive && !isKeyboardActive) {
        isKeyboardActive = true;
        document.body.classList.add('keyboard-active');
        
        // Auto-collapse Categories
        let catList = document.getElementById('categoryList');
        if (catList && !catList.hidden && smallPortrait) {
            // Only collapse if on a smaller screen where space is premium, or force it?
            // "auto-collapse Categories"
            let theCategoriesBtn = document.getElementById('theCategories');
            if(theCategoriesBtn && theCategoriesBtn.style.display !== 'none') {
                 // Trigger the click to collapse if it's open? Or just force hide.
                 catList.hidden = true;
            }
        }
    } else if (!currentlyActive && isKeyboardActive) {
        isKeyboardActive = false;
        document.body.classList.remove('keyboard-active');
    }
}

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleKeyboardState);
}
window.addEventListener('resize', handleKeyboardState);
document.getElementById('theText').addEventListener('focus', handleKeyboardState);
document.getElementById('theText').addEventListener('blur', () => { setTimeout(handleKeyboardState, 100); });


setTimeout(() => {
    let ss = document.querySelector('startsplash');
    if (ss && !ss.hidden) {
        ss.onclick();
    }
    if (window.toggleChatInterface) {
        window.toggleChatInterface(typeof chatShouldShow === 'function' ? chatShouldShow() : params.chatInterface);
    }
}, 3000);


// --- Toolbar overflow: when the buttons don't fit, the least-used move into the ⋯ menu ---
const TOOLBAR_ORDER = ['clearButton', 'undoButton', 'redoButton', 'micButton', 'bellButton', 'noButton', 'yesButton', 'sosButton', 'favButton', 'editButton', 'settingsButton', 'uploadButton'];
const TOOLBAR_OVERFLOW = ['uploadButton', 'settingsButton', 'editButton', 'favButton', 'redoButton', 'bellButton']; // first to move (never the microphone)
const TOOLBAR_APP_GROUP = ['editButton', 'settingsButton', 'uploadButton'];

function closeMoreMenu() {
    const menu = document.getElementById('moreMenu'), more = document.getElementById('moreButton');
    if (!menu || !more) return;
    menu.hidden = true;
    more.setAttribute('aria-expanded', 'false');
}

// The first app-group button still in the toolbar (or ⋯) is pushed to the right edge
function markToolbarPush() {
    const bar = document.getElementById('topToolbar'), more = document.getElementById('moreButton');
    bar.querySelectorAll('.tb-push').forEach(b => b.classList.remove('tb-push'));
    const first = TOOLBAR_APP_GROUP.map(id => document.getElementById(id)).find(b => b.parentNode === bar);
    (first || more).classList.add('tb-push');
}

function layoutToolbar() {
    const bar = document.getElementById('topToolbar'), more = document.getElementById('moreButton'), menu = document.getElementById('moreMenu');
    if (!bar || !more || !menu) return;
    closeMoreMenu();
    TOOLBAR_ORDER.forEach(id => { const b = document.getElementById(id); b.removeAttribute('role'); bar.insertBefore(b, more); });
    more.hidden = true;
    markToolbarPush();
    // The app name is shown only when everything fits; it's the first thing to go
    const title = document.getElementById('tbTitle');
    if (title) title.hidden = false;
    if (bar.scrollWidth <= bar.clientWidth) return;
    if (title) title.hidden = true;
    if (bar.scrollWidth <= bar.clientWidth) return;
    more.hidden = false;
    for (const id of TOOLBAR_OVERFLOW) {
        markToolbarPush();
        if (bar.scrollWidth <= bar.clientWidth) break;
        menu.appendChild(document.getElementById(id));
    }
    markToolbarPush();
    // Menu items in toolbar order
    TOOLBAR_ORDER.forEach(id => { const b = document.getElementById(id); if (b.parentNode === menu) { b.setAttribute('role', 'menuitem'); menu.appendChild(b); } });
}

(function () {
    const more = document.getElementById('moreButton'), menu = document.getElementById('moreMenu');
    if (!more || !menu) return;
    more.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!menu.hidden) { closeMoreMenu(); return; }
        const r = more.getBoundingClientRect();
        menu.style.top = (r.bottom + 4) + 'px';
        menu.style.right = (window.innerWidth - r.right) + 'px';
        menu.hidden = false;
        more.setAttribute('aria-expanded', 'true');
        const first = menu.querySelector('button:not(:disabled)');
        if (first) first.focus();
    });
    menu.addEventListener('click', closeMoreMenu); // after the item's own handler has run
    document.addEventListener('click', function (e) {
        if (!menu.hidden && !menu.contains(e.target) && e.target !== more) closeMoreMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMoreMenu(); });
    window.addEventListener('resize', layoutToolbar);
    window.addEventListener('load', layoutToolbar);
})();

// ---- Microphone: listening to the partner (on-device speech recognition, apps only) ----
// The toolbar button turns it on and off; the app reports what actually happened (listeningChanged).
window.toggleAmbient = function(on) {
    const msg = "ToggleListening:" + (on ? "true" : "false");
    if(typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.TexCom) {
        window.webkit.messageHandlers.TexCom.postMessage({"m": msg});
    } else if (typeof doingSAPI !== 'undefined' && doingSAPI && window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage(msg);
    } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": msg }));
    } else {
        return; // web browser: no speech recognition
    }
    setMicButton(on); // shown straight away; corrected by listeningChanged if it fails
};

function setMicButton(on) {
    const b = document.getElementById('micButton');
    if(!b) return;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.title = on ? 'Stop listening' : 'Listen to partner';
    b.setAttribute('aria-label', b.title);
}

// Called by the app: "on", "off", or "denied" (microphone or speech recognition permission refused)
window.listeningChanged = function(state) {
    setMicButton(state === 'on');
    if(state === 'denied' && typeof Notiflix !== 'undefined' && Notiflix.Notify) {
        Notiflix.Notify.failure('TexCom can’t use the microphone. Allow Microphone and Speech Recognition for TexCom in Settings.', { timeout: 6000 });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const b = document.getElementById('micButton');
    if(!b) return;
    b.hidden = !window.deviceSupportsAI; // apps only (the same test as the Smart AI features)
    b.addEventListener('click', () => toggleAmbient(b.getAttribute('aria-pressed') !== 'true'));
    if(typeof layoutToolbar === 'function') layoutToolbar();
});

// ---- Help: texcomhelp.html in a panel over TexCom, closed with ✕, Escape or a tap outside ----
window.openHelp = function () {
    const o = document.getElementById('helpOverlay'), f = document.getElementById('helpFrame');
    if (!o || !f) return;
    const url = 'texcomhelp.html?hasAI=' + (window.deviceSupportsAI ? 'true' : 'false');
    if (!f.getAttribute('src')) f.setAttribute('src', url);
    window.__helpReturnFocus = document.activeElement;
    o.hidden = false;
    setTimeout(() => document.getElementById('helpClose').focus(), 50);
};
function closeHelp() {
    const o = document.getElementById('helpOverlay');
    if (!o || o.hidden) return;
    o.hidden = true;
    const r = window.__helpReturnFocus;
    if (r && typeof r.focus === 'function' && document.contains(r)) r.focus();
}
document.addEventListener('DOMContentLoaded', () => {
    const o = document.getElementById('helpOverlay');
    if (!o) return;
    document.getElementById('helpClose').onclick = closeHelp;
    o.addEventListener('click', e => { if (e.target === o) closeHelp(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !o.hidden) { e.preventDefault(); closeHelp(); } });
    window.addEventListener('message', e => { if (e.data === 'texcom-close-help') closeHelp(); }); // Escape inside the help page
});

// ✕ on the "Matching …" line: show all phrases again (the text box is left as it is)
document.addEventListener('DOMContentLoaded', () => {
    const x = document.getElementById('filterClear');
    if (x) x.onclick = () => { filter.value = ''; filterPredict = ''; updateList(); };
});
