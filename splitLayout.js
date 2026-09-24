// We will inject this logic into windowResized
function applySplitLayout() {
    // Top row buttons (Clear, Undo, Redo, Yes, No, etc.) remain full width at top

    // Left Column (0vw to 49vw)
    let theText = document.getElementById('theText');
    if (theText) {
        theText.style.width = "38vw";
        theText.style.left = "1vw";
    }

    let speakButton = document.querySelector("speakButton");
    if (speakButton) {
        speakButton.style.width = "9vw";
        speakButton.style.left = "40vw";
    }

    let aiPredictionBox = document.getElementById('aiPredictionBox');
    if (aiPredictionBox) {
        aiPredictionBox.style.width = "48vw";
        aiPredictionBox.style.left = "1vw";
    }

    let chatHistoryContainer = document.getElementById('chatHistoryContainer');
    if (chatHistoryContainer) {
        chatHistoryContainer.style.width = "48vw";
        chatHistoryContainer.style.left = "1vw";
    }

    let aiAutoReplyBox = document.getElementById('aiAutoReplyBox');
    if (aiAutoReplyBox) {
        aiAutoReplyBox.style.width = "48vw";
        aiAutoReplyBox.style.left = "1vw";
    }
    
    let btnFlip = document.getElementById('flip');
    if(btnFlip) {
        btnFlip.style.left = "49vw";
    }

    // Right Column (50vw to 100vw)
    let theCategoriesButton = document.getElementById('theCategories');
    if (theCategoriesButton) {
        theCategoriesButton.style.width = "49vw";
        theCategoriesButton.style.left = "50vw";
    }

    let categoryList = document.getElementById('categoryList');
    if (categoryList) {
        categoryList.style.width = "50vw";
        categoryList.style.left = "50vw";
    }

    let theList = document.getElementById('messagesList');
    if (theList) {
        theList.style.width = "50vw";
        theList.style.left = "50vw";
    }

    let filter = document.getElementById('the-filter');
    if (filter) {
        filter.style.width = "49vw";
        filter.style.left = "50vw";
    }
}
