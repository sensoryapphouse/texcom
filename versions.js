var freeVersion = false;
var version = "V1.0.8 - 27-9-23";//added file name define in Share/Save and also retain Saved template in app
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
} else {
    if (window.chrome && window.chrome.webview !== undefined)
        doingSAPI = true;
}

var SAPInames = "";

var showTheMenu = false;
function gotWKWebViewVoices(s) { // for Apple WKWebView
    SAPInames = s;
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
