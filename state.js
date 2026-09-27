// Shared state for the page's scripts (they're plain scripts sharing globals; these are the ones used across files).
// Replaces panel.js, whose old absolutely-positioned phrase editor was replaced by editor.js.
var manifestInfo;                 // the user's phrase set (phrase-store.js loads and saves it)
var currentCommunicatorName;      // file name used when saving it
var categories = [];
var messages = [];
var doingCategories = false;      // makeLiText renders a category (true) or a phrase (false)
var itemChanged = false;          // the emoji picker sets this (libraries/picmo/popup.js)
var communicatorChanged = false;  // the phrase set has unsaved edits (asked about before opening another)
var guiVisible = false;           // Settings is open

var splash, startSplash, theText, theCategoriesButton, theList, categoryList;
var categoryName = "All";         // the selected category (reset to the set's own "All" name when it loads)

var txHistory = [""];             // undo snapshots of the text box (pushHistory in sketch2.js)
var placeInHistory = 0;

var target, targetIndex;          // the row being handled, and its index in manifestInfo
var lastMessageClicked = -1;

var clearButton = document.getElementById('clearButton');
var speakButton = document.getElementById('speakButton');
var undoButton = document.getElementById('undoButton');
var redoButton = document.getElementById('redoButton');
var yesButton = document.getElementById('yesButton');
var noButton = document.getElementById('noButton');
var sosButton = document.getElementById('sosButton');
var bellButton = document.getElementById('bellButton');
var favButton = document.getElementById('favButton');
var uploadButton = document.getElementById('uploadButton');
var settingsButton = document.getElementById('settingsButton');
var filter = document.createElement("input"); // the phrase filter (no Search box: the text box searches; see sketch2.js)

// Phrase and category text is shown as text, never as HTML: a shared phrase set containing "<img onerror=...>"
// would otherwise run script in the app
function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// A list row's contents: emoji, a thin space, the text, and the drag handle (shown in Edit mode)
function makeLiText() {
    const item = doingCategories ? manifestInfo.categories[targetIndex] : manifestInfo.messages[targetIndex];
    let sHTML = "<span>" + escapeHTML(item.emoji) + "</span> &#8201" + escapeHTML(item.name);
    if (!item.fixed) sHTML += "<span class='quick'></span>";
    return sHTML;
}
