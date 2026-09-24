import {
    createPopup
} from './index.js';

document.addEventListener('DOMContentLoaded', () => {
//    const selectionContainer = document.querySelector('#selection-outer');
//    const emoji = document.querySelector('#selection-emoji');
//    const name = document.querySelector('#selection-name');
    const trigger = document.querySelector('#trigger');

    const picker = createPopup({        
        showSearch: true,
        showCategoryTabs: true,
        showPreview: false
        }, {
        referenceElement: trigger,
        triggerElement: trigger,
//        className: "picmoClass",
//       position: 'right-end'
    });
    
//    const pclass = document.getElementsByClassName("picmoClass");
//    pclass.style.zorder = 9000;
    
//    picker.options.showCategoryTabs = false;

    trigger.addEventListener('click', () => {
        picker.toggle();
    });

    picker.addEventListener('emoji:select', (selection) => {
         itemChanged = true;
         if (btnEmoji.tagName === 'INPUT') btnEmoji.value = selection.emoji; // item editor's Symbol field
         else btnEmoji.innerHTML = selection.emoji;
    });
});
