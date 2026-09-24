const synth = window.speechSynthesis;

function speak(s, preview) { // preview: a voice test - not part of the conversation
    if (!preview && typeof appendToChatHistory === 'function' && s.trim().length > 0) {
        appendToChatHistory(s, false);
    }
    if (!preview && window.Conversation && s.trim().length > 0) {
        window.Conversation.send(s); // the partner in an internet conversation
    }
    if (!preview && typeof sendToPartnerDisplay === 'function' && s.trim().length > 0) {
        sendToPartnerDisplay(s); // partner display window / external screen
    }
    if (doingSAPI) {
        window.chrome.webview.postMessage("Speak:" + s);
    }
    else if (webViewIOS) {
        var message = "Speak:" + s;
        window.webkit.messageHandlers.TexCom.postMessage({
                "m": message
            });
    }
    else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Speak:" + s }));
    }
    else {
        const utterance = new SpeechSynthesisUtterance(s);
        if (typeof voices !== 'undefined' && voices && voices.length > 0 && voiceIndex !== undefined && voices[voiceIndex]) {
            utterance.voice = voices[voiceIndex];
        }
        utterance.pitch = params.voicePitch;
        utterance.rate = params.voiceRate;
        utterance.volume = params.voiceVolume;
        synth.cancel();
        synth.speak(utterance);
    }
}

function mute() {
    if (doingSAPI) {
        window.chrome.webview.postMessage("StopSpeech");
    }
    else if (webViewIOS) {
        window.webkit.messageHandlers.TexCom.postMessage({ "m": "Stop" }); // the app reads the "m" key
    }
    else if (typeof webViewAndroid !== 'undefined' && webViewAndroid && window.AndroidTexCom) {
        window.AndroidTexCom.postMessage(JSON.stringify({ "m": "Stop" }));
    }
    else {
        synth.cancel();
    }
}

function SOS() {
    Promise.resolve()
        .then(() => beep(80))
        .then(() => delay(100))
        .then(() => beep(80))
        .then(() => delay(100))
        .then(() => beep(80))
        .then(() => delay(200))

        .then(() => beep(200))
        .then(() => delay(210))
        .then(() => beep(200))
        .then(() => delay(210))
        .then(() => beep(200))
        .then(() => delay(250))

        .then(() => beep(80))
        .then(() => delay(100))
        .then(() => beep(80))
        .then(() => delay(100))
        .then(() => beep(80));
}

// The browser will limit the number of concurrent audio contexts
// So be sure to re-use them whenever you can
const myAudioContext = new AudioContext();

/**
 * Helper function to emit a beep sound in the browser using the Web Audio API.
 * 
 * @param {number} duration - The duration of the beep sound in milliseconds.
 * @param {number} frequency - The frequency of the beep sound.
 * @param {number} volume - The volume of the beep sound.
 * 
 * @returns {Promise} - A promise that resolves when the beep sound is finished.
 */
function beep(duration, frequency, volume) {
    return new Promise((resolve, reject) => {
        // Set default duration if not provided
        duration = duration || 200;
        frequency = frequency || 440;
        volume = volume || 100;

        try {
            let oscillatorNode = myAudioContext.createOscillator();
            let gainNode = myAudioContext.createGain();
            oscillatorNode.connect(gainNode);

            // Set the oscillator frequency in hertz
            oscillatorNode.frequency.value = frequency;

            // Set the type of oscillator
            oscillatorNode.type = "square";
            gainNode.connect(myAudioContext.destination);

            // Set the gain to the volume
            gainNode.gain.value = volume * 0.01;

            // Start audio with the desired duration
            oscillatorNode.start(myAudioContext.currentTime);
            oscillatorNode.stop(myAudioContext.currentTime + duration * 0.001);

            // Resolve the promise when the sound is finished
            oscillatorNode.onended = () => {
                resolve();
            };
        } catch (error) {
            reject(error);
        }
    });
}

function delay(duration) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), duration);
    });
}
