// Phrase / category editor and Edit mode.
// Replaces the old absolutely-positioned panel (panel.js showPanel), which could not be closed on
// small screens and edited the wrong item when AI reply rows were at the top of the list.

// Rows that are not manifest items: AI replies and the "+ Add" rows shown in Edit mode
function isSpecialRow(li) {
    return li.classList.contains('ai-injected-reply') || li.classList.contains('ed-add');
}

// Index of a row's item in manifestInfo.categories / .messages (special rows are always at the top)
function listItemIndex(li) {
    return [...li.parentElement.children].filter(c => !isSpecialRow(c)).indexOf(li);
}

function isEditing() {
    return document.body.classList.contains('editing');
}

// ---------- Editor dialog ----------
let editorState = null; // { kind: 'phrase'|'category', index, isNew, li, returnFocus }

function openItemEditorForLi(li) {
    if (!li || isSpecialRow(li)) return;
    const kind = li.parentElement.id === 'categoryList' ? 'category' : 'phrase';
    const index = listItemIndex(li);
    if (index < 0) return;
    if (kind === 'category' && index < 2) return; // "All" and "Favourites" are built in
    openItemEditor({ kind, index, isNew: false, li });
}

function openNewItem(kind) {
    openItemEditor({ kind, index: -1, isNew: true, li: null });
}

function openItemEditor(state) {
    editorState = state;
    editorState.returnFocus = document.activeElement;
    const isPhrase = state.kind === 'phrase';
    const item = state.isNew ? null : (isPhrase ? manifestInfo.messages[state.index] : manifestInfo.categories[state.index]);

    document.getElementById('edTitle').textContent =
        (state.isNew ? 'New ' : 'Edit ') + (isPhrase ? 'phrase' : 'category');
    document.getElementById('edText').value = item ? item.name.trim() : '';
    document.getElementById('edEmoji').value = item ? (item.emoji || '').trim() : '';
    document.getElementById('edAbbrev').value = item && item.abbreviation ? item.abbreviation.trim() : '';
    document.getElementById('edFixed').checked = item ? !!item.fixed : false;
    document.getElementById('edInstant').checked = item ? (item.instant === true || item.instant === 'true') : false;
    document.getElementById('edDeletable').checked = item ? item.deletable !== false : true;
    document.getElementById('edError').hidden = true;

    // Phrase-only fields
    document.querySelectorAll('#itemEditor [data-for="phrase"]').forEach(el => el.hidden = !isPhrase);
    if (isPhrase) {
        const box = document.getElementById('edCats');
        box.innerHTML = '';
        // Default categories for a new phrase: the current category (if it's a real one)
        let current = (categoryName && categoryName !== 'All') ? categoryName : '';
        for (let i = 1; i < manifestInfo.categories.length; i++) {
            const name = manifestInfo.categories[i].name;
            const checked = item ? item.categories.includes('[' + name + ']') : (name === current);
            const label = document.createElement('label');
            label.className = 'ed-check';
            label.innerHTML = '<input type="checkbox"><span class="ed-cat-emoji"></span><span></span>';
            label.querySelector('input').checked = checked;
            label.querySelector('input').dataset.name = name;
            label.querySelector('.ed-cat-emoji').textContent = manifestInfo.categories[i].emoji;
            label.querySelector('span:last-child').textContent = name;
            box.appendChild(label);
        }
    }

    // Delete only for existing, deletable items
    document.getElementById('edDelete').hidden = state.isNew || (item && item.deletable === false);

    const overlay = document.getElementById('itemEditorOverlay');
    overlay.hidden = false;
    document.getElementById('edText').focus();
}

function closeItemEditor() {
    document.getElementById('itemEditorOverlay').hidden = true;
    const f = editorState && editorState.returnFocus;
    editorState = null;
    if (window.__savedBtnEmoji !== undefined) { window.btnEmoji = window.__savedBtnEmoji; delete window.__savedBtnEmoji; }
    if (f && typeof f.focus === 'function' && document.contains(f)) f.focus();
}

function renderRow(kind, index, li) {
    doingCategories = (kind === 'category');
    targetIndex = index;
    li.innerHTML = makeLiText();
    doingCategories = false;
}

function saveItemEditor() {
    const s = editorState;
    if (!s) return;
    const isPhrase = s.kind === 'phrase';
    const name = document.getElementById('edText').value.trim();
    if (!name) {
        const err = document.getElementById('edError');
        err.textContent = 'Please enter some text.';
        err.hidden = false;
        document.getElementById('edText').focus();
        return;
    }
    let emoji = document.getElementById('edEmoji').value.trim();
    if (!emoji && typeof getBestEmoji === 'function') emoji = getBestEmoji(name, '');
    const list = isPhrase ? theList : categoryList;
    const items = isPhrase ? manifestInfo.messages : manifestInfo.categories;
    let index = s.index, li = s.li;

    if (s.isNew) {
        const base = { name: name, emoji: emoji, colour: '#000000', deletable: true, fixed: false };
        if (isPhrase) Object.assign(base, { abbreviation: '', instant: false, categories: '', gotaudio: false, audioData: '' });
        index = isPhrase ? 0 : 2; // new phrases at the top; new categories after All / Favourites
        items.splice(index, 0, base);
        li = document.createElement('li');
        li.className = 'demo-no-reorder';
        li.dataset.bools = 'fixed no-edit';
        const rows = [...list.children].filter(c => !isSpecialRow(c));
        list.insertBefore(li, rows[index] || null);
    }

    const item = items[index];
    if (!isPhrase && item.name !== name) {
        // Renaming a category: update every phrase that belongs to it
        manifestInfo.messages.forEach(m => { m.categories = m.categories.replace('[' + item.name + ']', '[' + name + ']'); });
        if (categoryName === item.name) categoryName = name;
    }
    item.name = name;
    item.emoji = emoji;
    item.fixed = document.getElementById('edFixed').checked;
    item.deletable = document.getElementById('edDeletable').checked;
    if (isPhrase) {
        item.abbreviation = document.getElementById('edAbbrev').value.trim();
        item.instant = document.getElementById('edInstant').checked;
        item.categories = [...document.querySelectorAll('#edCats input')].filter(c => c.checked).map(c => '[' + c.dataset.name + ']').join('');
    }

    renderRow(s.kind, index, li);
    saveToLocalStorage();
    communicatorChanged = true;
    closeItemEditor();
    afterListChange();
}

function deleteFromEditor() {
    const s = editorState;
    if (!s || s.isNew) return;
    const isPhrase = s.kind === 'phrase';
    const items = isPhrase ? manifestInfo.messages : manifestInfo.categories;
    const name = items[s.index].name;
    const doDelete = () => {
        if (!isPhrase && categoryName === name) categoryName = 'All';
        items.splice(s.index, 1);
        s.li.remove();
        saveToLocalStorage();
        communicatorChanged = true;
        closeItemEditor();
        afterListChange();
    };
    if (typeof Notiflix !== 'undefined' && Notiflix.Confirm) {
        Notiflix.Confirm.show('Delete', 'Delete "' + name + '"?', 'Delete', 'Keep', doDelete, () => {}, {
            okButtonBackground: '#dc2626', okButtonColor: '#ffffff',
            cancelButtonBackground: '#e2e8f0', cancelButtonColor: '#1e293b',
            titleFontSize: '22px', messageFontSize: '18px', buttonsFontSize: '18px',
            width: '340px', messageMaxLength: 200, fontFamily: 'inherit'
        });
    } else if (confirm('Delete "' + name + '"?')) {
        doDelete();
    }
}

// Refresh filters, the selected-category highlight, the toggle label and the edit pencils
function afterListChange() {
    if (typeof updateCategoriesButton === 'function') updateCategoriesButton();
    if (typeof updateList === 'function') updateList();
    if (typeof markSelectedCategory === 'function') markSelectedCategory();
    refreshEditDecorations();
}

// ---------- Edit mode ----------
function setEditing(on) {
    document.body.classList.toggle('editing', on);
    const b = document.getElementById('editButton');
    if (b) {
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.title = on ? 'Done editing' : 'Edit phrases';
        b.setAttribute('aria-label', b.title);
    }
    refreshEditDecorations();
}

// In Edit mode: a pencil on each editable row and a "+ Add" row at the top of each list
function refreshEditDecorations() {
    const on = isEditing();
    [['messagesList', 'phrase', 'Add phrase'], ['categoryList', 'category', 'Add category']].forEach(([id, kind, label]) => {
        const list = document.getElementById(id);
        if (!list) return;
        let add = list.querySelector('.ed-add');
        if (on && !add) {
            add = document.createElement('li');
            add.className = 'ed-add demo-no-swipe demo-no-reorder';
            add.dataset.kind = kind;
            add.innerHTML = '<span>➕</span> &#8201' + label;
            list.insertBefore(add, list.firstChild);
        } else if (!on && add) {
            add.remove();
        }
        [...list.children].forEach((li, i) => {
            if (isSpecialRow(li)) return;
            const idx = listItemIndex(li);
            const editable = on && !(kind === 'category' && idx < 2);
            let pen = li.querySelector('.ed-pencil');
            if (editable && !pen) {
                pen = document.createElement('button');
                pen.type = 'button';
                pen.className = 'ed-pencil';
                pen.setAttribute('aria-label', 'Edit');
                li.appendChild(pen);
            } else if (!editable && pen) {
                pen.remove();
            }
        });
    });
}

// ---------- Wiring (after parsing: the dialog markup comes after this script in index.html) ----------
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('itemEditorOverlay');
    if (!overlay) return;
    document.getElementById('edSave').addEventListener('click', saveItemEditor);
    document.getElementById('edCancel').addEventListener('click', closeItemEditor);
    document.getElementById('edClose').addEventListener('click', closeItemEditor);
    document.getElementById('edDelete').addEventListener('click', deleteFromEditor);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeItemEditor(); });
    document.addEventListener('keydown', e => {
        if (overlay.hidden) return;
        if (e.key === 'Escape') { e.preventDefault(); closeItemEditor(); }
        else if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') { e.preventDefault(); saveItemEditor(); }
    });
    // Optional emoji picker (needs internet for its emoji data); typing in the field always works
    document.getElementById('edEmojiPick').addEventListener('click', () => {
        const trigger = document.getElementById('trigger');
        if (!trigger) return;
        if (window.__savedBtnEmoji === undefined) window.__savedBtnEmoji = window.btnEmoji;
        window.btnEmoji = document.getElementById('edEmoji');
        const r = document.getElementById('edEmojiPick').getBoundingClientRect();
        Object.assign(trigger.style, { position: 'fixed', left: r.left + 'px', top: r.bottom + 'px', width: '1px', height: '1px' });
        trigger.hidden = false;
        trigger.click();
        trigger.hidden = true;
    });

    // Pencil buttons: remember the press so the list's own tap handler ignores it
    ['messagesList', 'categoryList'].forEach(id => {
        const list = document.getElementById(id);
        list.addEventListener('pointerdown', e => { if (e.target.closest('.ed-pencil')) window.pencilTapped = true; }, true);
        list.addEventListener('click', e => {
            const pen = e.target.closest('.ed-pencil');
            if (!pen) return;
            e.stopPropagation();
            window.pencilTapped = false;
            openItemEditorForLi(pen.closest('li'));
        }, true);
    });

    const editButton = document.getElementById('editButton');
    if (editButton) editButton.addEventListener('click', () => setEditing(!isEditing()));
});
