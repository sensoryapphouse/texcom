// Protecting TexCom (as PiCom's carer.js): an optional PIN, the Settings button and phrase editing.
// - PIN (off by default): Settings and phrase editing ask for it on the start screen (the splash); it stays unlocked
//   until Settings closes or editing ends. "Forgot PIN?" takes the recovery code shown when the PIN was set.
//   The PIN and the recovery code are kept only as salted hashes, on this device.
// - "Settings button on the main screen" (params.showSettingsButton, on by default): off, Settings opens only from
//   the start screen.
// - "Lock phrases" (params.lockPhrases): no Edit button, no swipe-to-edit, no adding, changing, moving or deleting
//   phrases and categories. Speaking, favourites and everything else work as before.
// - The start screen is shown when TexCom opens; from the main screen, holding a top corner for 3 seconds goes back to
//   it (nothing for this shows on the main screen).
var TexComCarer = (function () {
    var KEY = 'TexComCarerPIN';
    var unlocked = false, pending = null, area = null;

    function stored() {
        try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
    }
    function hasPin() { var s = stored(); return !!(s && s.pin); }
    function locked() { return hasPin() && !unlocked; }

    async function hash(text, salt) {
        var data = new TextEncoder().encode(salt + ':' + text);
        if (window.crypto && crypto.subtle) {
            var buf = await crypto.subtle.digest('SHA-256', data);
            return [].map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        }
        var h = 2166136261; // FNV-1a where SubtleCrypto isn't available (not a secure context)
        for (var i = 0; i < data.length; i++) { h ^= data[i]; h = Math.imul(h, 16777619) >>> 0; }
        return 'f' + h.toString(16);
    }
    function randomText(n, alphabet) {
        var out = '', bytes = new Uint8Array(n);
        crypto.getRandomValues(bytes);
        for (var i = 0; i < n; i++) out += alphabet[bytes[i] % alphabet.length];
        return out;
    }

    // Set (or change) the PIN; returns the recovery code to show ("ABCD-EFGH")
    async function setPin(pin) {
        var salt = randomText(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
        var rec = randomText(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
        localStorage.setItem(KEY, JSON.stringify({ salt: salt, pin: await hash(pin, salt), recovery: await hash(rec, salt) }));
        unlocked = true; // the carer setting it is in Settings
        renderSplash();
        return rec.slice(0, 4) + '-' + rec.slice(4);
    }
    function removePin() { localStorage.removeItem(KEY); unlocked = false; renderSplash(); }

    async function check(text, field) {
        var s = stored();
        if (!s || !s[field]) return false;
        return (await hash(String(text).replace(/[\s-]/g, '').toUpperCase(), s.salt)) === s[field]
            || (await hash(String(text).trim(), s.salt)) === s[field];
    }

    // Run `action` now if unlocked; otherwise show the start screen with the PIN field and run it after
    function require(action) {
        if (!locked()) { action(); return; }
        pending = action;
        toSplash();
        showPinArea(t('Enter the PIN'));
    }

    // ---- The PIN field on the start screen ---------------------------------------------------------------------
    function buildPinArea() {
        if (area) return;
        area = document.createElement('form');
        area.id = 'tcSplashPin';
        area.autocomplete = 'off';
        area.hidden = true;
        area.innerHTML =
            '<label for="tcPin"></label>' +
            '<div class="tcp-row"><input id="tcPin" type="password" inputmode="numeric" autocomplete="off" maxlength="12">' +
            '<button type="submit" class="tcp-unlock"></button></div>' +
            '<p class="tcp-msg" role="status"></p>' +
            '<button type="button" class="tcp-forgot"></button>';
        // The zone is the clear part of the start screen (below the title, above the corner buttons); style.css centres the box in it
        var zone = document.createElement('div');
        zone.id = 'tcSplashZone';
        zone.appendChild(area);
        document.body.appendChild(zone);
        // A phone's on-screen keyboard covers the bottom of the page (the page keeps its height), which is where the box
        // sits: while it is up, the box moves into the part still showing (it was hidden behind the keyboard)
        if (window.visualViewport) {
            var keyboard = function () {
                var covered = Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop);
                document.documentElement.style.setProperty('--keyboard-inset', (covered > 80 ? covered : 0) + 'px');
                document.documentElement.classList.toggle('keyboard-up', covered > 80);
            };
            visualViewport.addEventListener('resize', keyboard);
            visualViewport.addEventListener('scroll', keyboard);
            keyboard();
        }
        area.onsubmit = function (e) { e.preventDefault(); tryUnlock(); };
        area.querySelector('.tcp-forgot').onclick = function () { showPinArea(t('Enter the recovery code you were given when the PIN was set')); };
        renderSplash();
    }

    function splashShowing() { return typeof splash !== 'undefined' && splash && !splash.hidden; }

    function renderSplash() {
        if (!area) return;
        area.querySelector('label').textContent = t('PIN');
        area.querySelector('.tcp-unlock').textContent = t('Unlock');
        area.querySelector('.tcp-forgot').textContent = t('Forgot PIN?');
        area.hidden = !(locked() && splashShowing());
    }

    function showPinArea(message) {
        renderSplash();
        area.querySelector('.tcp-msg').textContent = message || '';
        var input = area.querySelector('input');
        input.value = '';
        setTimeout(function () { input.focus(); }, 50);
    }

    async function tryUnlock() {
        var input = area.querySelector('input');
        var ok = await check(input.value, 'pin');
        if (!ok && input.value.replace(/[\s-]/g, '').length === 8) ok = await check(input.value, 'recovery');
        if (!ok) {
            area.querySelector('.tcp-msg').textContent = t('That PIN is not right');
            input.value = '';
            input.focus(); // ready for another try (on a phone the keyboard stays up, and the box stays where it is)
            return;
        }
        unlocked = true;
        input.value = '';
        input.blur();
        var then = pending || openSettingsFromSplash;
        pending = null;
        leaveSplash(then);
        relockAfter();
    }

    // Unlocked for one visit: once Settings, Edit mode and the phrase editor are all closed, the PIN is needed again
    function relockAfter() {
        setTimeout(function () {
            var overlay = document.getElementById('settingsOverlay'), editor = document.getElementById('itemEditorOverlay');
            var busy = (overlay && overlay.style.display === 'flex') || (typeof isEditing === 'function' && isEditing()) || (editor && !editor.hidden);
            if (busy) { relockAfter(); return; }
            if (hasPin()) { unlocked = false; renderSplash(); }
        }, 1500);
    }

    // ---- Start screen ------------------------------------------------------------------------------------------
    function leaveSplash(then) {
        if (splashShowing()) startSplash.onclick();
        renderSplash();
        if (then) setTimeout(then, 250); // after the start screen's own setting-up (setUpGUI)
    }
    function openSettingsFromSplash() { openSettingsBefore(); }

    // From the main screen back to the start screen (the corner hold, or the PIN being asked for)
    var swallowUntil = 0;
    function toSplash() {
        swallowUntil = Date.now() + 800;
        var overlay = document.getElementById('settingsOverlay');
        if (overlay && overlay.style.display === 'flex') toggleSettingsBefore();
        if (typeof isEditing === 'function' && isEditing()) setEditingBefore(false);
        if (typeof closeItemEditor === 'function') { var ed = document.getElementById('itemEditorOverlay'); if (ed && !ed.hidden) closeItemEditor(); }
        [splash, startSplash, helpSplash, settingsSplash].forEach(function (b) { if (b) b.hidden = false; });
        if (area) { area.querySelector('.tcp-msg').textContent = ''; area.querySelector('input').value = ''; }
        renderSplash();
    }

    // The hold is made where toolbar buttons are: the click the browser sends when the finger lifts must not press the
    // button that was under it (Clear, say). For a moment after, clicks in the top corners are swallowed.
    function swallow(e) {
        if (Date.now() >= swallowUntil || !e.isTrusted || e.detail === 0) return;
        if (area && area.contains(e.target)) return;
        if (e.clientY < 120 && (e.clientX < 160 || e.clientX > window.innerWidth - 160)) { e.stopPropagation(); e.preventDefault(); }
    }
    ['click', 'mousedown', 'mouseup'].forEach(function (type) { window.addEventListener(type, swallow, true); });

    // Hold a top corner of the main screen for 3 seconds
    var holdTimer = null, holdStart = null;
    function cornerHold(e) {
        if (splashShowing()) return;
        var c = 72, x = e.clientX, y = e.clientY;
        if (y > c || (x > c && x < window.innerWidth - c)) return;
        holdStart = { x: x, y: y };
        clearTimeout(holdTimer);
        holdTimer = setTimeout(function () { holdTimer = null; toSplash(); }, 3000);
    }
    function cancelHold(e) {
        if (!holdTimer) return;
        if (e.type === 'pointermove' && holdStart && Math.abs(e.clientX - holdStart.x) + Math.abs(e.clientY - holdStart.y) < 20) return;
        clearTimeout(holdTimer);
        holdTimer = null;
    }
    document.addEventListener('pointerdown', cornerHold, true);
    ['pointerup', 'pointercancel', 'pointermove'].forEach(function (ev) { document.addEventListener(ev, cancelHold, true); });

    // ---- The Settings button and phrase editing ----------------------------------------------------------------
    function applyProtection() {
        var settingsBtn = document.getElementById('settingsButton'), editBtn = document.getElementById('editButton');
        if (settingsBtn) settingsBtn.hidden = params.showSettingsButton === false;
        if (editBtn) editBtn.hidden = !!params.lockPhrases;
        if (params.lockPhrases && typeof isEditing === 'function' && isEditing()) setEditingBefore(false);
        if (typeof layoutToolbar === 'function') layoutToolbar();
    }

    // Guard the ways into Settings and editing (settings.js, editor.js and sketch2.js call these by their global names)
    var toggleSettingsBefore = window.toggleSettings, openSettingsBefore = function () { toggleSettingsBefore(); };
    var setEditingBefore = window.setEditing, editLiBefore = window.openItemEditorForLi, newItemBefore = window.openNewItem;
    function settingsOpen() { var o = document.getElementById('settingsOverlay'); return o && o.style.display === 'flex'; }
    window.clickSettings = window.toggleSettings = function () {
        if (settingsOpen()) { toggleSettingsBefore(); return; } // closing is never guarded
        require(toggleSettingsBefore);
    };
    window.setEditing = function (on) {
        if (!on) { setEditingBefore(false); return; }
        if (params.lockPhrases) return;
        require(function () { setEditingBefore(true); });
    };
    window.openItemEditorForLi = function (li) {
        if (params.lockPhrases) return;
        require(function () { editLiBefore(li); });
    };
    window.openNewItem = function (kind) {
        if (params.lockPhrases) return;
        require(function () { newItemBefore(kind); });
    };

    // The start screen's Settings button: the PIN first, if one is set
    function settingsSplashTapped(e) {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (locked()) { pending = null; showPinArea(t('Enter the PIN')); return; }
        leaveSplash(openSettingsFromSplash);
        if (hasPin()) relockAfter();
    }

    function setUp() {
        buildPinArea();
        settingsSplash.onclick = settingsSplashTapped;
        settingsSplash.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') settingsSplashTapped(e); };
        // Start goes to the main screen: the PIN field goes with the start screen
        var startBefore = startSplash.onclick;
        startSplash.onclick = function (e) { var r = startBefore.call(this, e); renderSplash(); return r; };
        applyProtection();
        window.addEventListener('texcom-ui-text', renderSplash);
    }
    (function whenReady() {
        if (typeof startSplash === 'undefined' || !startSplash || !startSplash.onclick || typeof settingsSplash === 'undefined' || !settingsSplash
            || typeof params !== 'object' || !params)
            return setTimeout(whenReady, 100);
        setUp();
    })();

    function lock() { unlocked = false; pending = null; renderSplash(); }

    return { hasPin: hasPin, setPin: setPin, removePin: removePin, check: check, locked: locked, lock: lock, require: require,
             toSplash: toSplash, applyProtection: applyProtection };
})();
