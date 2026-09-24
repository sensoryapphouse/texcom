'use strict';

let instance = null;
let isConstructorAllowed = false;

/**
 * @class PopupMenu
 * @implements {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement|HTMLElement}
 * @classdesc
 * Implements the functionality of a popup up menu to be displayed in your
 * application. The popup menu contains of the list of the provided menu items.
 * <p>
 * PopupMenu closes itself on {@link https://www.w3schools.com/jsref/event_onclick.asp|click} event
 * fired by {@link https://www.w3schools.com/js/js_window.asp|window}. To display
 * the menu on click, you must mark the 'click' event as
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Event/defaultPrevented|defaultPrevented}
 * using {@link https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault|preventDefault()},
 * so the PopupMenu will ignore it. See the
 * {@link https://github.com/ui-widgets-js/popup-menu/blob/master/demo/index.js|example}.
 * </p>
 * <p>
 * PopupMenu closes itself on {@link https://www.w3schools.com/jsref/event_onresize.asp| resize} and
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/orientationchange_event|orientationchange}
 * events fired by {@link https://www.w3schools.com/js/js_window.asp|window}.
 * </p>
 * 
 * @listens window#click
 * @listens window#resize
 * @listens window#orientationchange
 * 
 * @example
 *  // Display PopupMenu under the button
 *  const myButton = document.getElementById('myButton');
 *  const itemList = [
 *    new PopupMenuItem(1, 'Menu item 1'),
 *    new PopupMenuItem(2, 'Menu item 2'),
 *    new PopupMenuItem(3, 'Menu item 3')
 *  ];
 *  const position = PopupMenuPosition.alignBottomLeft(myButton);
 *  const selectedId = await PopupMenu.show(itemList, position);
 */
export default class PopupMenu extends HTMLElement {
    /**
     * @constructor
     * @private
     * @param {PopupMenuItem[]} menuItems Menu items to be displayed
     */
    constructor(menuItems) {
        if (!isConstructorAllowed) {
            throw new Error('This is private constructor. Use PopupMenu.show() instead.');
        }
        super();
        this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          width: auto;
          height: auto;
          font-size: small;
          font-family: Arial, sans-serif;
          max-width: 320px;
          overflow-y: auto;
          overflow-x: hidden;
          background-color: white;
          position: absolute;
          box-sizing: border-box;
          box-shadow: rgba(221, 221, 221, 0.35) 0px 2px 8px;
          border: 1px lightgray solid;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          color: #24292E;
          overflow: hidden;
          padding-top: 5px;
          padding-bottom: 5px;
          animation: appear .2s ease-in;
          -webkit-animation: appear .2s ease-in;
          -moz-animation: appear .2s ease-in;
        }

        .popup-menu-item {
          text-align: left;
          overflow: hidden;
          display: flex;
          width: 100%;
          max-width: 100%;
          height: 32px;
          max-height: 32px;
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
        }

        .popup-menu-item:hover {
          background-color: #D3D3D352;
        }

        .popup-menu-item .image {
          min-width: 30px;
          min-height: 30px;
          background-repeat: no-repeat;
          background-position: center;
        }

        .popup-menu-item p {
          margin-top: 0px;
          margin-bottom: 0px;
          margin-left: 8px;
          margin-right: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: inherit;
        }

        @keyframes appear {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @-webkit-keyframes appear {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @-moz-keyframes appear {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

      </style>
      `;

        const isContainsImages = menuItems.findIndex(item => item.imageUrl) >= 0;
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('popup-menu-item');
            menuItem.innerHTML = `<p>${item.itemName}</p>`;

            if (item.imageUrl) {
                menuItem.innerHTML =
                    `<div class="image" style="background-image: url('${item.imageUrl}')"></div>` +
                    menuItem.innerHTML;
            } else if (isContainsImages) {
                // Place holder to align record with the records which contain image
                menuItem.innerHTML =
                    `<div class="image"></div>` +
                    menuItem.innerHTML;
            }

            menuItem.addEventListener('click', (e) => {
                this._onPopupMenuItemClick(item.itemId);
            });
            this.shadowRoot.appendChild(menuItem);
        });
        this._onHandleClosingEvent = this._onHandleClosingEvent.bind(this);
    }

    connectedCallback() {
    ['click', 'resize', 'orientationchange'].forEach(eventName =>
            window.addEventListener(eventName, this._onHandleClosingEvent));
    }

    disconnectedCallback() {
    ['click', 'resize', 'orientationchange'].forEach(eventName =>
            window.removeEventListener(eventName, this._onHandleClosingEvent));
    }

    /**
     * @private
     * @param {DOMEvent} e Closes the existing instance of PopupMenu if specified
     * event is not defaultPrevented
     */
    _onHandleClosingEvent(e) {
        if (!e.defaultPrevented) {
            PopupMenu.close();
        }
    }

    /**
     * @private
     * @param {any} itemId The id of the selected item
     */
    _onPopupMenuItemClick(itemId) {
        if (this.onItemSelected) {
            this.onItemSelected(itemId);
            this.onItemSelected = null;
        }
    }

    static get is() {
        return 'popup-menu';
    }

    /**
     * Displays the popup menu and returns the id of the selected item
     * asynchronously.
     * 
     * Example of usage:
     *
     *  const selectedId = await PopupMenu.show(itemsList, position);
     * 
     * @static
     * @async
     * @memberof PopupMenu
     * @param {PopupMenuItem[]} menuItems The list of items to be displayed
     * @param {PopupMenuPosition} position The position of PopupMenu
     */
    static async show(menuItems, position) {
        // Validate the input
        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            throw new Error('Invalid parameter: items must be a non empty Array of PopupMenuItem');
        }
        if (!menuItems.every(item => item instanceof PopupMenuItem)) {
            throw new Error(`Invalid parameter: each menu item must be an instance PopupMenuItem`);
        }
        if (!(position instanceof PopupMenuPosition)) {
            throw new Error('Invalid parameter: position must be an instance of PopupMenuPosition');
        }
        PopupMenu.close();
        isConstructorAllowed = true;
        instance = new PopupMenu(menuItems);
        isConstructorAllowed = false;

        instance.style.top = position.top;
        instance.style.left = position.left;
        instance.style.right = position.right;
        instance.style.bottom = position.bottom;

        const itemId = await new Promise(resolve => {
            instance.onItemSelected = resolve;
            document.body.appendChild(instance);
        });
        return itemId;
    }

    /**
     * Closes any existing instance of PopupMenu on the screen
     * @static
     * @memberof PopupMenu
     */
    static close() {
        if (instance) {
            try {
                if (instance.onItemSelected) {
                    instance.onItemSelected(undefined);
                }
                instance.parentElement.removeChild(instance);
            } catch (error) {
                console.error(`PopupMenu: ${error}\n${error.stack}`);
            }
            instance = null;
        }
    }
}

if (!window.customElements.get(PopupMenu.is)) {
    window.customElements.define(PopupMenu.is, PopupMenu);
}
/**
 * @classdesc A container of the absolute coordinates of the {@link PopupMenu}
 * item to be displayed.
 */
class PopupMenuPosition {
    /**
     * Provide at least two coordinates to determine the absolute position of the
     * {@link PopupMenu} in a browser or in a webview.
     * @constructor
     * @param {number} [left] Left horizontal offset
     * @param {number} [top] Top vertical offset
     * @param {number} [right] Right horizontal offset
     * @param {number} [bottom] Bottom vertical offset
     */
    constructor(left, top, right, bottom) {
        const isProvided = arg => arg !== null && arg !== undefined;

        // Validate input
        if (isProvided(left) && typeof (left) !== 'number') {
            throw new Error('Invalid Parameter: left must be an integer');
        }
        if (isProvided(top) && typeof (top) !== 'number') {
            throw new Error('Invalid Parameter: top must be an integer');
        }
        if (isProvided(right) && typeof (right) !== 'number') {
            throw new Error('Invalid Parameter: right must be an integer');
        }
        if (isProvided(bottom) && typeof (bottom) !== 'number') {
            throw new Error('Invalid Parameter: bottom must be an integer');
        }

        this.left = isProvided(left) ? `${left}px` : undefined;
        this.top = isProvided(top) ? `${top}px` : undefined;
        this.right = isProvided(right) ? `${right}px` : undefined;
        this.bottom = isProvided(bottom) ? `${bottom}px` : undefined;
    }

    /**
     * Places the {@link PopupMenu} under the provided dom element. Aligns the left border
     * of the {@link PopupMenu} with the left border of the provided dom element.
     * @param {HTMLElement} domElement The menu will be displayed under this element
     */
    static alignBottomLeft(domElement) {
        const rect = domElement.getBoundingClientRect();
        return new PopupMenuPosition(
            rect.left,
            rect.bottom
        );
    }

    /**
     * Places the {@link PopupMenu} under the provided dom element. Aligns the right
     * border of the {@link PopupMenu} with the right border of the provided dom element.
     * @param {HTMLElement} domElement The menu will be displayed under this element.
     */
    static alignBottomRight(domElement) {
        const rect = domElement.getBoundingClientRect();
        return new PopupMenuPosition(
            undefined,
            rect.bottom,
            window.innerWidth - rect.right
        );
    }

    /**
     * Places the {@link PopupMenu} on the top of the provided dom element. Aligns the left
     * border of the {@link PopupMenu} with the left border of the provided dom element.
     * @param {HTMLElement} domElement The menu will be displayed on top of this element.
     */
    static alignTopLeft(domElement) {
        const rect = domElement.getBoundingClientRect();
        return new PopupMenuPosition(
            rect.left,
            undefined,
            undefined,
            window.innerHeight - rect.top
        );
    }

    /**
     * Places the {@link PopupMenu} on the top of the provided dom element. Aligns the right
     * border of the {@link PopupMenu} with the right border of the provided dom element.
     * @param {HTMLElement} domElement The menu will be displayed on top of this element.
     */
    static alignTopRight(domElement) {
        const rect = domElement.getBoundingClientRect();
        return new PopupMenuPosition(
            undefined,
            undefined,
            window.innerWidth - rect.right,
            window.innerHeight - rect.top
        );
    }
    static alignCentre(domElement) {
        const rect = domElement.getBoundingClientRect();
        return new PopupMenuPosition(
            window.innerWidth * .4,
            undefined,
            undefined,
            window.innerHeight / 2
        );
    }
    static alignAt(domElement, x, y) {
        const rect = domElement.getBoundingClientRect();
        return new PopupMenuPosition(
            x,
            y,
            undefined,
            undefined
        );
    }
}
/**
 * @ignore
 */

/**
 * @class PopupMenuItem
 * @classdesc A model of an item of the menu to be displayed
 */
class PopupMenuItem {
    /**
     * @constructor
     * @param {any} id The unique ID of the menu item
     * @param {string} name The menu item content
     * @param {string} [imageUrl] The menu item image
     */
    constructor(id, name, imageUrl) {
        this.itemId = id;
        this.itemName = name;
        this.imageUrl = imageUrl;
    }
}

export {
    PopupMenuItem,
    PopupMenuPosition
};
