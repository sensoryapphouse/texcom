var freeVersion = false;
var version = "2026-11-14-3cd26da"; // the published web version: scripts/build_web.py stamps <date>-<commit> here
var testing = false;
var isChromium = navigator.userAgent.includes("Chrome");
var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

var doingSAPI = false;

var webViewIOS = false; // true for iOS build, false for everything else
var webViewAndroid = false; // true for Android build
if (window.webkit && window.webkit.messageHandlers) {
    webViewIOS = true;
} else if (window.AndroidTexCom) {
    webViewAndroid = true;
    // The languages the phone's on-device AI (Gemini Nano) is used for; unsaid where it isn't available (settings.js)
    try { const list = window.AndroidTexCom.aiLanguages && window.AndroidTexCom.aiLanguages(); if (list) window.texcomAILanguages = JSON.parse(list); } catch (e) {}
} else {
    if (window.chrome && window.chrome.webview !== undefined)
        doingSAPI = true;
}

var SAPInames = "";

var showTheMenu = false;
function gotWKWebViewVoices(s) { // for Apple WKWebView
    SAPInames = s;
    if (typeof window.populateVoices === 'function') window.populateVoices(); // the Settings list
}

// The Android app: each voice's language code, by the name shown ({"Sofía: Spanish (Spain)": "es-ES"}), for
// choosing a voice when the language changes (language.js)
function gotVoiceTags(json) {
    try { window.texcomVoiceTags = JSON.parse(json); } catch (e) {}
}

function setVersion(s) { // call from system
    version = s;
    var message = "Stop";
    if (typeof webViewIOS !== 'undefined' && webViewIOS && window.webkit) {
        window.webkit.messageHandlers.TexCom.postMessage({"m": "Stop"});
    } else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
        window.AndroidTexCom.postMessage(JSON.stringify({"m": "Stop"}));
    }
}
