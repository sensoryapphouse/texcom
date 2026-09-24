var manifestInfo;
var currentCommunicatorName;
var categories = [];
var messages = [];

var titleLbl;
var closeButton;
var txtText;
var btnEmoji;
var lblEmoji;
var lblDeleteable;
var lblFixed;
var lblInstant;
var instantChk;
var lblAbbreviation;
var txtAbbreviation;
var lblCategories;
var lblRecording;
var btnDeleteSnd;
var btnLoadSnd;
var btnStopRec;
var btnRecSnd;
var btnPlay;
var btnTxtCol;
var checkList;

var doingCategories = false;

var itemChanged = false;
var communicatorChanged = false;
var options = []; // select options

var gui;
var guiVisible = false;

var splash;
var startSplash;
var theText;

var theCategoriesButton;
var theList;
var categoryList;
var categoryName = "All";
var iconSelect;

var txHistory = [];
var placeInHistory = 0;

var target;
var targetIndex;
var lastMessageClicked = -1;

var buttonPanel = document.querySelector('buttonPanel'); // a <buttonPanel> element with no id (getElementById was null and threw)
buttonPanel.style.width = "60vw";

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
var texcomButton = document.getElementById('texcomButton');
var filter = document.createElement("input"); // the phrase filter (no Search box: the text box searches; see sketch2.js)

function showPanel() {
    buttonPanel.hidden = false;
    //btnEmoji.innerHTML = target.innerText.substr(0, target.innerText.indexOf(' '));
    console.log("Target Index: ", targetIndex)
    if (doingCategories) {
        txtText.value = manifestInfo.categories[targetIndex].name.trim();
        btnEmoji.innerHTML = manifestInfo.categories[targetIndex].emoji;
        btnTxtCol.value = manifestInfo.categories[targetIndex].colour;
        deleteableChk.checked = manifestInfo.categories[targetIndex].deletable;
        fixedChk.checked = manifestInfo.categories[targetIndex].fixed;
        titleLbl.innerHTML = "Category";
        buttonPanel.style.height = "32vh";
        lblInstant.hidden = true;
        instantChk.hidden = true;
        lblAbbreviation.hidden = true;
        txtAbbreviation.hidden = true;
        lblCategories.hidden = true;
        lblRecording.hidden = true;
        btnDeleteSnd.hidden = true;
        btnLoadSnd.hidden = true;
        btnStopRec.hidden = true;
        btnRecSnd.hidden = true;
        btnPlay.hidden = true;
        checkList.hidden = true;
    } else { // messages
        txtText.value = manifestInfo.messages[targetIndex].name.trim();
        btnEmoji.innerHTML = manifestInfo.messages[targetIndex].emoji;
        btnTxtCol.value = manifestInfo.messages[targetIndex].colour;
        deleteableChk.checked = manifestInfo.messages[targetIndex].deletable;
        fixedChk.checked = manifestInfo.messages[targetIndex].fixed;
        instantChk.checked = manifestInfo.messages[targetIndex].instant;
        txtAbbreviation.value = manifestInfo.messages[targetIndex].abbreviation;
        titleLbl.innerHTML = "Message";
        buttonPanel.style.height = "48vh";
        lblInstant.hidden = false;
        instantChk.hidden = false;
        lblAbbreviation.hidden = false;
        txtAbbreviation.hidden = false;
        lblCategories.hidden = false;
        if (freeVersion)
            lblCategories.hidden = true;
        lblRecording.hidden = false;
        btnDeleteSnd.hidden = false;
        btnLoadSnd.hidden = false;
        btnStopRec.hidden = false;
        btnRecSnd.hidden = false;
        btnPlay.hidden = false;
        checkList.hidden = true;
        checkList.innerHTML = '';

        function addItem(s, isChecked) {
            var li = document.createElement('li'); //li
            var text = document.getElementById('texto');

            var checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.name = s;
            //            checkbox.id = "id";
            checkbox.checked = isChecked;
            checkbox.onchange = function (e) {
                itemChanged = true;
            }
            li.appendChild(checkbox);
            li.appendChild(document.createTextNode(" " + s));
            checkList.appendChild(li);
        }
        for (let i = 1; i < manifestInfo.categories.length; i++) {
            let s = "[" + manifestInfo.categories[i].name + "]";
            addItem(manifestInfo.categories[i].name, manifestInfo.messages[targetIndex].categories.includes(s));
        }
    }
}

function makeLiText() {
    let sHTML = "";
    if (doingCategories) {
        sHTML = "<span style=font-size:3vh;>" + manifestInfo.categories[targetIndex].emoji + "</span> &#8201" + manifestInfo.categories[targetIndex].name;
        if (!manifestInfo.categories[targetIndex].fixed)
            sHTML += "<span class = 'quick'>";
    } else {
        sHTML = "<span style=font-size:3.3vh;>" + manifestInfo.messages[targetIndex].emoji + "</span> &#8201" + manifestInfo.messages[targetIndex].name;
        if (!manifestInfo.messages[targetIndex].fixed)
            sHTML += "<span class = 'quick'></span>";
    }
    return sHTML;
}

function closeEdit() { // do Cancel/OK
    buttonPanel.hidden = true;
    stopRecording();
    if (itemChanged) {
        if (doingCategories) {
            if (manifestInfo.categories[targetIndex].name != txtText.value) {
                for (let i = 0; i < manifestInfo.messages.length; i++) {
                    manifestInfo.messages[i].categories = manifestInfo.messages[i].categories.replace("[" + manifestInfo.categories[targetIndex].name + "]", "[" + txtText.value + "]");
                }
                manifestInfo.categories[targetIndex].name = txtText.value;
            }
            manifestInfo.categories[targetIndex].emoji = btnEmoji.innerHTML.trim();
            manifestInfo.categories[targetIndex].colour = btnTxtCol.value;
            manifestInfo.categories[targetIndex].deletable = deleteableChk.checked;
            manifestInfo.categories[targetIndex].fixed = fixedChk.checked;
            target.style.color = manifestInfo.categories[targetIndex].colour;
        } else {
            manifestInfo.messages[targetIndex].name = txtText.value;
            manifestInfo.messages[targetIndex].emoji = btnEmoji.innerHTML.trim();
            manifestInfo.messages[targetIndex].colour = btnTxtCol.value;
            manifestInfo.messages[targetIndex].deletable = deleteableChk.checked;
            manifestInfo.messages[targetIndex].fixed = fixedChk.checked;
            manifestInfo.messages[targetIndex].instant = instantChk.checked;
            manifestInfo.messages[targetIndex].abbreviation = txtAbbreviation.value;
            let s = "";
            for (let i = 0; i < checkList.children.length; i++) {
                if (checkList.children[i].childNodes[0].checked)
                    s += "[" + checkList.children[i].childNodes[0].name + "]";
            }
            manifestInfo.messages[targetIndex].categories = s;
            target.style.color = manifestInfo.messages[targetIndex].colour;
        }
    }
    target.innerHTML = makeLiText();
    //    console.log("Item changed: ", itemChanged, targetIndex);
    saveToLocalStorage();
    itemChanged = false;
    communicatorChanged = true;
}


function setUpPanel() {
    checkList = document.getElementById('listCat');
    if (smallPortrait) {
        buttonPanel.style.width = "92vw";
    }

    titleLbl = document.createElement("LABEL");
    titleLbl.style.position = "absolute";
    titleLbl.style.height = "5vh";
    titleLbl.style.width = "60vw";
    if (smallPortrait) {
        titleLbl.style.width = "92vw";
    }
    titleLbl.style.left = "0vw";
    titleLbl.style.top = "0vh";
    titleLbl.style.fontFamily = "sans-serif";
    titleLbl.style.fontSize = "4vh";
    titleLbl.style.color = 'black';
    titleLbl.style.background = 'skyblue';
    titleLbl.style.border = "none";
    titleLbl.style.textAlign = "center";
    titleLbl.innerHTML = "Categories";

    closeButton = document.createElement("INPUT");
    closeButton.style.position = "absolute";
    closeButton.style.height = "4.5vh";
    closeButton.style.width = "4.5vw";
    closeButton.style.left = "55.25vw";
    if (smallPortrait) {
        closeButton.style.left = "87.25vw";
    }
    closeButton.style.top = "0.125vh";
    closeButton.style.backgroundSize = "4.5vw 4.5vh";
    closeButton.style.backgroundImage = "url('images/close.png')";
    closeButton.setAttribute("type", "button");
    closeButton.style.border = "none";
    closeButton.onclick = function (e) {
        closeEdit();
    }

    txtText = document.createElement("INPUT");
    txtText.style.position = "absolute";
    txtText.style.height = "4vh";
    txtText.style.width = "56vw";
    txtText.style.left = "2vw";
    if (smallPortrait) {
        txtText.style.width = "86vw";
    }
    txtText.style.top = "7vh";
    txtText.style.fontFamily = "sans-serif";
    txtText.style.fontSize = "3vh";
    txtText.style.color = 'black';
    txtText.style.background = 'white';
    txtText.style.border = "inset";
    txtText.value = "";
    txtText.oninput = function (e) {
        itemChanged = true;
    }

    //    btnEmoji = document.createElement("BTN");
    btnEmoji = document.querySelector('#trigger');
    btnEmoji.style.position = "absolute";
    btnEmoji.style.height = "6vh";
    btnEmoji.style.width = "12vw";
    btnEmoji.style.left = "2vw";
    btnEmoji.style.top = "13.5vh";
    btnEmoji.style.fontFamily = "sans-serif";
    btnEmoji.style.fontSize = "4vh";
    btnEmoji.style.color = 'black';
    btnEmoji.style.background = 'white';
    btnEmoji.style.border = "outset";
    btnEmoji.innerHTML = "🔷";
    btnEmoji.style.textAlign = "center";
    btnEmoji.style.verticalAlign = "center";
    btnEmoji.hidden = false;
    //    btnEmoji.setAttribute("type", "BTN");
    btnEmoji.onchange = function (e) {
        itemChanged = true;
    }
   
    deleteableChk = document.createElement("INPUT");
    deleteableChk.style.position = "absolute";
    deleteableChk.style.height = "4vh";
    deleteableChk.style.width = "4vw";
    deleteableChk.style.left = "2vw";
    deleteableChk.style.top = "21vh";
    deleteableChk.checked = false;
    deleteableChk.setAttribute("type", "checkbox");
    deleteableChk.onchange = function (e) {
        itemChanged = true;
    }

    fixedChk = document.createElement("INPUT");
    fixedChk.style.position = "absolute";
    fixedChk.style.height = "4vh";
    fixedChk.style.width = "4vw";
    fixedChk.style.left = "2vw";
    fixedChk.style.top = "26vh";
    fixedChk.checked = false;
    fixedChk.setAttribute("type", "checkbox");
    fixedChk.onchange = function (e) {
        itemChanged = true;
    }

    instantChk = document.createElement("INPUT");
    instantChk.style.position = "absolute";
    instantChk.style.height = "4vh";
    instantChk.style.width = "4vw";
    instantChk.style.left = "2vw";
    instantChk.style.top = "31vh";
    instantChk.checked = false;
    instantChk.setAttribute("type", "checkbox");
    instantChk.onchange = function (e) {
        itemChanged = true;
    }

    lblEmoji = document.createElement("LABEL");
    lblEmoji.style.position = "absolute";
    lblEmoji.style.height = "5vh";
    lblEmoji.style.width = "50vw";
    lblEmoji.style.left = "15vw";
    lblEmoji.style.top = "15vh";
    lblEmoji.style.fontFamily = "sans-serif";
    lblEmoji.style.fontSize = "3vh";
    lblEmoji.style.color = 'black';
    lblEmoji.style.background = 'transparent';
    lblEmoji.style.border = "none";
    lblEmoji.style.textAlign = "left";
    lblEmoji.style.verticalAlign = "center";
    lblEmoji.innerHTML = "Emoji";
    lblEmoji.onclick = function (e) {}
    if (smallPortrait) {
        lblEmoji.style.left = "22vw";
    }
    lblDeleteable = document.createElement("LABEL");
    lblDeleteable.style.position = "absolute";
    lblDeleteable.style.height = "5vh";
    lblDeleteable.style.width = "50vw";
    lblDeleteable.style.left = "8vw";
    lblDeleteable.style.top = "22vh";
    lblDeleteable.style.fontFamily = "sans-serif";
    lblDeleteable.style.fontSize = "3vh";
    lblDeleteable.style.color = 'black';
    lblDeleteable.style.background = 'transparent';
    lblDeleteable.style.border = "none";
    lblDeleteable.style.textAlign = "left";
    lblDeleteable.style.verticalAlign = "center";
    lblDeleteable.innerHTML = "Deletable";
    lblDeleteable.onclick = function (e) {
        itemChanged = true;
        deleteableChk.checked = !deleteableChk.checked;
    }

    lblFixed = document.createElement("LABEL");
    lblFixed.style.position = "absolute";
    lblFixed.style.height = "5vh";
    lblFixed.style.width = "50vw";
    lblFixed.style.left = "8vw";
    lblFixed.style.top = "27vh";
    lblFixed.style.fontFamily = "sans-serif";
    lblFixed.style.fontSize = "3vh";
    lblFixed.style.color = 'black';
    lblFixed.style.background = 'transparent';
    lblFixed.style.border = "none";
    lblFixed.style.textAlign = "left";
    lblFixed.style.verticalAlign = "center";
    lblFixed.innerHTML = "Fixed position";
    lblFixed.onclick = function (e) {
        itemChanged = true;
        fixedChk.checked = !fixedChk.checked;
    }

    lblInstant = document.createElement("LABEL");
    lblInstant.style.position = "absolute";
    lblInstant.style.height = "5vh";
    lblInstant.style.width = "50vw";
    lblInstant.style.left = "8vw";
    lblInstant.style.top = "32vh";
    lblInstant.style.fontFamily = "sans-serif";
    lblInstant.style.fontSize = "3vh";
    lblInstant.style.color = 'black';
    lblInstant.style.background = 'transparent';
    lblInstant.style.border = "none";
    lblInstant.style.textAlign = "left";
    lblInstant.style.verticalAlign = "center";
    lblInstant.innerHTML = "Instant Message";
    lblInstant.onclick = function (e) {
        itemChanged = true;
        instantChk.checked = !instantChk.checked;
    }

    lblAbbreviation = document.createElement("LABEL");
    lblAbbreviation.style.position = "absolute";
    lblAbbreviation.style.height = "5vh";
    lblAbbreviation.style.width = "30vw";
    lblAbbreviation.style.left = "18.5vw";
    lblAbbreviation.style.top = "39vh";
    lblAbbreviation.style.fontFamily = "sans-serif";
    lblAbbreviation.style.fontSize = "3vh";
    lblAbbreviation.style.color = 'black';
    lblAbbreviation.style.background = 'transparent';
    lblAbbreviation.style.border = "none";
    lblAbbreviation.style.textAlign = "left";
    lblAbbreviation.style.verticalAlign = "center";
    lblAbbreviation.innerHTML = "Abbreviation";
    if (smallPortrait) {
        lblAbbreviation.style.left = "32vw";
    }

    txtAbbreviation = document.createElement("INPUT");
    txtAbbreviation.style.position = "absolute";
    txtAbbreviation.style.height = "4vh";
    txtAbbreviation.style.width = "10vw";
    txtAbbreviation.style.left = "3vw";
    txtAbbreviation.style.top = "38vh";
    txtAbbreviation.style.fontFamily = "sans-serif";
    txtAbbreviation.style.fontSize = "3vh";
    txtAbbreviation.style.color = 'black';
    txtAbbreviation.style.background = 'white';
    txtAbbreviation.style.border = "inset";
    txtAbbreviation.value = "";
    txtAbbreviation.oninput = function (e) {
        itemChanged = true;
    }
    if (smallPortrait) {
        txtAbbreviation.style.width = "20vw";
    }
    if (!freeVersion) {
        checkList.style.position = "absolute";
        checkList.style.top = "31vh";
        checkList.style.height = "21vh";
        checkList.style.width = "24vw";
        checkList.style.left = "34vw";
        if (smallPortrait) {
            checkList.style.width = "39vw";
            checkList.style.left = "50vw";
        }
        checkList.style.border = 'inset';
        checkList.onclick = function (e) {
            if (e.target.nodeName == "LI")
                e.target.childNodes[0].checked = !e.target.childNodes[0].checked;
            itemChanged = true;
        }
    }

    lblCategories = document.createElement("LABEL");
    lblCategories.style.position = "absolute";
    lblCategories.style.height = "14vh";
    lblCategories.style.width = "23vw";
    lblCategories.style.left = "34vw";
    if (smallPortrait) {
        lblCategories.style.width = "38vw";
        lblCategories.style.left = "50vw";
    }

    lblCategories.style.top = "29.5vh";
    lblCategories.style.fontFamily = "sans-serif";
    lblCategories.style.fontSize = "3vh";
    lblCategories.style.color = 'black';
    lblCategories.style.background = 'transparent';
    //    lblCategories.style.border = "outset";
    lblCategories.style.textAlign = "left";
    lblCategories.style.verticalAlign = "center";
    lblCategories.innerHTML = " Categories";

    lblRecording = document.createElement("LABEL");
    lblRecording.style.position = "absolute";
    lblRecording.style.height = "12vh";
    lblRecording.style.width = "56vw";
    lblRecording.style.left = "2vw";
    if (smallPortrait) {
        lblRecording.style.width = "87vw";
    }
    lblRecording.style.top = "47vh";
    lblRecording.style.fontFamily = "sans-serif";
    lblRecording.style.fontSize = "3vh";
    lblRecording.style.color = 'black';
    lblRecording.style.background = 'lightskyblue';
    lblRecording.style.border = "outset";
    lblRecording.style.textAlign = "left";
    lblRecording.style.verticalAlign = "center";
    lblRecording.innerHTML = "";

    btnTxtCol = document.createElement('INPUT');
    btnTxtCol.style.position = "absolute";
    btnTxtCol.style.height = "15vh";
    btnTxtCol.style.width = "13vw";
    btnTxtCol.style.left = "46vw";
    if (smallPortrait) {
        btnTxtCol.style.width = "20vw";
        btnTxtCol.style.left = "70vw";
    }
    btnTxtCol.style.top = "14vh";
    btnTxtCol.style.border = "none";
    btnTxtCol.style.backgroundSize = "100% 100%";
    btnTxtCol.style.backgroundImage = "url('images/colours.png')";
    btnTxtCol.setAttribute("type", "color");
    btnTxtCol.onchange = function (e) {
        itemChanged = true;
    }
    btnTxtCol.oninput = function (e) {
        itemChanged = true;
    }

    btnPlay = document.createElement('INPUT');
    btnPlay.style.position = "absolute";
    btnPlay.style.height = "8vh";
    btnPlay.style.width = "8vw";
    btnPlay.style.left = "4vw";
    if (smallPortrait) {
        btnPlay.style.width = "15vw";
    }
    btnPlay.style.top = "49vh";
    btnPlay.style.border = "none";
    btnPlay.style.borderColor = "transparent";
    btnPlay.style.backgroundSize = "100% 100%";
    btnPlay.style.backgroundImage = "url('images/play.png')";
    btnPlay.style.backgroundColor = "transparent";
    btnPlay.setAttribute("type", "button");
    btnPlay.onmouseup = function (e) {
        if (myBoard.buttons[btnIndex].hasOwnProperty('sound_id')) {
            snd = myBoard.buttons[btnIndex].sound_id;
            if (snd != -1) {
                var i = soundIndexFromId(snd);
                var is = myBoard.sounds[i];
                if (is.hasOwnProperty('data'))
                    snd = loadSound(is.data, soundLoaded);
                else if (is.hasOwnProperty('path'))
                    snd = loadSound(boardsFolderName + is.path, soundLoaded);
                else if (is.hasOwnProperty('url'))
                    snd = loadSound(is.url, soundLoaded);
            }
        }
    }

    btnRecSnd = document.createElement('INPUT');
    btnRecSnd.style.position = "absolute";
    btnRecSnd.style.height = "8vh";
    btnRecSnd.style.width = "8vw";
    btnRecSnd.style.left = "15vw ";
    if (smallPortrait) {
        btnRecSnd.style.width = "15vw";
        btnRecSnd.style.left = "21.5vw";
    }
    btnRecSnd.style.top = "49vh";
    btnRecSnd.style.border = "none";
    btnRecSnd.style.backgroundSize = "100% 100%";
    btnRecSnd.style.backgroundImage = "url('images/record.png')";
    btnRecSnd.style.backgroundColor = "transparent";
    btnRecSnd.setAttribute("type", "button");
    btnRecSnd.onclick = function (e) {
        buttonsChanged = true;
        startRecording();
    }

    btnStopRec = document.createElement('INPUT');
    btnStopRec.style.position = "absolute";
    btnStopRec.style.height = "8vh";
    btnStopRec.style.width = "8vw";
    btnStopRec.style.left = "26vw";
    if (smallPortrait) {
        btnStopRec.style.width = "15vw";
        btnStopRec.style.left = "38.5vw";
    }
    btnStopRec.style.top = "49vh";
    btnStopRec.style.border = "none";
    btnStopRec.style.backgroundSize = "100% 100%";
    btnStopRec.style.backgroundImage = "url('images/stop.png')";
    btnStopRec.style.backgroundColor = "transparent";
    btnStopRec.setAttribute("type", "button");
    btnStopRec.style.opacity = .5;
    btnStopRec.onclick = function (e) {
        buttonsChanged = true;
        stopRecording();
    }

    btnDeleteSnd = document.createElement('INPUT');
    btnDeleteSnd.style.position = "absolute";
    btnDeleteSnd.style.height = "8vh";
    btnDeleteSnd.style.width = "8vw";
    btnDeleteSnd.style.left = "37vw";
    if (smallPortrait) {
        btnDeleteSnd.style.width = "15vw";
        btnDeleteSnd.style.left = "55.5vw";
    }
    btnDeleteSnd.style.top = "49vh";
    btnDeleteSnd.style.border = "none";
    btnDeleteSnd.style.backgroundSize = "100% 100%";
    btnDeleteSnd.style.backgroundImage = "url('images/trash.png')";
    btnDeleteSnd.style.backgroundColor = "transparent";
    btnDeleteSnd.setAttribute("type", "button");
    btnDeleteSnd.onclick = function (e) {
        if (myBoard.buttons[btnIndex].hasOwnProperty('sound_id')) {
            var s = myBoard.buttons[btnIndex].hasOwnProperty('sound_id');
            s = soundIndexFromId(s);
            myBoard.sounds[s] = "";
            delete myBoard.buttons[btnIndex].sound_id;
            buttonsChanged = true;
        }
    }

    btnLoadSnd = document.createElement('INPUT');
    btnLoadSnd.style.position = "absolute";
    btnLoadSnd.style.height = "8vh";
    btnLoadSnd.style.width = "8vw";
    btnLoadSnd.style.left = "48vw";
    if (smallPortrait) {
        btnLoadSnd.style.width = "15vw";
        btnLoadSnd.style.left = "72.5vw";
    }
    btnLoadSnd.style.top = "49vh";
    btnLoadSnd.style.border = "none";
    btnLoadSnd.style.borderColor = "transparent";
    btnLoadSnd.style.backgroundSize = "100% 100%";
    btnLoadSnd.style.backgroundImage = "url('images/LoadSnd.png')";
    btnLoadSnd.style.backgroundColor = "transparent";
    btnLoadSnd.setAttribute("type", "button");
    btnLoadSnd.onclick = function (e) {
        var fileLoad = document.getElementById('sound-input').click();
        buttonsChanged = true;
    }
    document.getElementById('sound-input').addEventListener('change', function (evt) {
        var sndFile = document.getElementById('sound-input').files[0];
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            var s = "";
            if (myBoard.sounds.length == 0) { // no sounds yet
                s = "TexCom1";
            } else {
                if (myBoard.buttons[btnIndex].hasOwnProperty('sound_id')) {
                    s = myBoard.buttons[btnIndex].sound_id;
                    var i = soundIndexFromId(s);
                    myBoard.sounds[i].data = event.target.result;
                    return;
                } else {
                    s = myBoard.sounds[myBoard.sounds.length - 1].id;
                    if (s.includes("TexCom")) {
                        s = s.substr(5);
                        s = "TexCom" + (parseInt(s) + 1);
                    } else
                        s = "TexCom1";
                }
            }

            myBoard.buttons[btnIndex].sound_id = s;
            var tmp = {
                "id": s,
                "data": event.target.result
            }
            myBoard.sounds[myBoard.sounds.length] = tmp;
        });
        reader.readAsDataURL(sndFile);
    });

    buttonPanel.appendChild(titleLbl);
    buttonPanel.appendChild(txtText);
    buttonPanel.appendChild(btnEmoji);
    buttonPanel.appendChild(deleteableChk);
    buttonPanel.appendChild(fixedChk);
    buttonPanel.appendChild(instantChk);
    buttonPanel.appendChild(lblEmoji);
    buttonPanel.appendChild(lblDeleteable);
    buttonPanel.appendChild(lblFixed);
    buttonPanel.appendChild(lblInstant);
    buttonPanel.appendChild(lblAbbreviation);
    buttonPanel.appendChild(txtAbbreviation);
    buttonPanel.appendChild(lblCategories);
    //    buttonPanel.appendChild(lblRecording);
    //    buttonPanel.appendChild(btnPlay);
    //    buttonPanel.appendChild(btnRecSnd);
    //    buttonPanel.appendChild(btnStopRec);
    //    buttonPanel.appendChild(btnLoadSnd);
    //    buttonPanel.appendChild(btnDeleteSnd);
    buttonPanel.appendChild(btnTxtCol);
    buttonPanel.appendChild(closeButton);
    buttonPanel.appendChild(checkList);

    function onDragEnter(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    function onDragOver(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    function onDragLeave(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    var fileType;

    function onDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        if (buttonPanel.hidden)
            return;

        if (e.dataTransfer.files.length > 0) {
            var imgFile = e.dataTransfer.files[0];
            var imgName = imgFile.name.replace(/\.[^/.]+$/, "")
            filetype = imgFile.type
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                if (filetype.toLowerCase().includes("audio")) {

                    var s = ""
                    if (myBoard.sounds.length == 0) { // no sounds yet
                        s = "TexCom1";
                    } else {
                        if (myBoard.buttons[btnIndex].hasOwnProperty('sound_id')) {
                            s = myBoard.buttons[btnIndex].sound_id;
                            var i = soundIndexFromId(s);
                            myBoard.sounds[i].data = event.target.result;
                            return;
                        } else {
                            s = myBoard.sounds[myBoard.sounds.length - 1].id;
                            if (s.includes("TexCom")) {
                                s = s.substr(5);
                                s = "TexCom" + (parseInt(s) + 1);
                            } else
                                s = "TexCom";
                        }
                    }
                    myBoard.buttons[btnIndex].sound_id = s;
                    var tmp = {
                        "id": s,
                        "data": event.target.result
                    }
                    myBoard.sounds[myBoard.sounds.length] = tmp;
                }

            });
            reader.readAsDataURL(imgFile);
        }
        return false;
    }

    var tmpPicture;

    function pictureLoaded() {
        refreshBoard++;
        myBoard.images[myBoard.images.length] = tmpPicture;
    }

    document.addEventListener('dragenter', onDragEnter, false);
    document.addEventListener('dragover', onDragOver, false);
    document.addEventListener('dragleave', onDragLeave, false);
    document.addEventListener('drop', onDrop, false);

    if (params.tooltips) {
        MarcTooltips.add(closeButton, 'Close Panel', {
            position: 'down',
            align: 'right',
            className: 'green'
        });
        MarcTooltips.add(settingsButton, "Show Settings", {
            position: 'down',
            align: 'right',
            className: 'green'
        });
        MarcTooltips.add(clearButton, "Clear Text", {
            position: 'down',
            align: 'left',
            className: 'green'
        });
        MarcTooltips.add(speakButton, "Speak message", {
            position: 'left',
            align: 'right',
            className: 'green'
        });
        MarcTooltips.add(undoButton, "Undo", {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        MarcTooltips.add(redoButton, "Redo", {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        MarcTooltips.add(yesButton, "Say Yes", {
            position: 'bottom',
            align: 'right',
            className: 'green'
        });
        MarcTooltips.add(noButton, "Say No", {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        let tmp = MarcTooltips.add(favButton, "Add \nto Favourites", {
            position: 'bottom',
            align: 'right',
            className: 'green'
        });
        tmp.style.width = "120px";
        MarcTooltips.add(bellButton, "Ring bell", {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        MarcTooltips.add(sosButton, "SOS", {
            position: 'bottom',
            align: 'right',
            className: 'green'
        });
        MarcTooltips.add(uploadButton, "Share", {
            position: 'bottom',
            align: 'right',
            className: 'green'
        });
        tmp = MarcTooltips.add(btnStopRec, strStopRecording, {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        tmp.style.width = "120px";
        tmp = MarcTooltips.add(btnRecSnd, strRecordSound, {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        tmp.style.width = "120px";
        tmp = MarcTooltips.add(btnPlay, strPlaySound, {
            position: 'bottom',
            align: 'left',
            className: 'green'
        });
        tmp.style.width = "120px";
        tmp = MarcTooltips.add(btnDeleteSnd, strDeleteSound, {
            position: 'down',
            align: 'right',
            className: 'green'
        });
        tmp.style.width = "120px";
        tmp = MarcTooltips.add(btnLoadSnd, strLoadSound, {
            position: 'down',
            align: 'right',
            className: 'green'
        });
        tmp.style.width = "120px";
        tmp = MarcTooltips.add(theText, "Edit area. Type etc.\nClick to set caret and stop speaking.\nType abbreviation then @ or /.", {
            position: 'down',
            className: 'green'
        });
        tmp.style.width = "60vw";
        tmp = MarcTooltips.add(theCategoriesButton, "Current category for search", {
            position: 'down',
            className: 'green'
        });
        tmp.style.width = "120px";
    }

}
