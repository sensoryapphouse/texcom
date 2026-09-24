// Partner display link: each phrase the user says goes to the partner's screen.
// - The partner's own phone (companion.html, over the companion link) is sent phrases by speak() in audio.js.
// - Mac debug builds: a "TexCom – Partner" window (partner.html) stands in for the partner's screen;
//   the app shows each phrase there when it gets a "Partner:" message.
(function () {
    const isMacDebug = !!window.texcomMacApp; // injected by the Mac app in debug builds only

    window.sendToPartnerDisplay = function (text) {
        try { localStorage.setItem('texcomPartnerLast', text); } catch (e) {} // partner.html shows it when it opens
        if (isMacDebug && window.webkit && window.webkit.messageHandlers)
            window.webkit.messageHandlers.TexCom.postMessage({ m: 'Partner:' + text });
    };

    window.partnerWindowAvailable = isMacDebug;
    window.openPartnerWindow = function () {
        if (isMacDebug) window.webkit.messageHandlers.TexCom.postMessage({ m: 'OpenPartnerWindow' });
    };
})();
