// Get the list of adventures
async function getListOfAdventures(){
    var adventures = await MyFetch.call("GET", `https://files.dejaithekid.com/adventures/`);
    adventures = adventures.map(result => new Adventure(result));
    adventures.push(new Adventure({"name": "_Default", "adventureID": 0}));
    adventures.sort( (a, b) => { return a.Name.localeCompare(b.Name) });
    MyPageManager.addContent("Adventures", adventures);
    return adventures;
}

// Show the list of adventures
async function onShowAdventures(loadFromUrl=false) {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var adventureList = await MyTemplates.getTemplateAsync("templates/lists/adventure-list.html", MyPageManager.getContent("Adventures") );
        MyDom.setContent("#listOfAdventures", {"innerHTML": adventureList});
        onSetActiveTab("adventures");
        loadContentFromURL();
        // Set the group options in the adventure details form
        var groupOpts = await MyTemplates.getTemplateAsync("templates/options/group-option.html", MyPageManager.getContent("Groups"));
        MyDom.setContent("#adventureDetailsForm #accessGroup", {"innerHTML": "<option></option>" + groupOpts});
        
        MyDom.hideContent(".hideOnAdventuresLoaded");
        MyDom.showContent(".showOnAdventuresLoaded");
        MyDom.showContent("#adventuresTabSection");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Adventure & its files
async function onSelectAdventure(option){
    try{
        var adventureID = option.getAttribute("data-adventure-id") ?? "";
        MyUrls.modifySearch({"tab" : "adventures", "content":adventureID});
        var adventure = MyPageManager.getContent("Adventures")?.filter(x => x.AdventureID == adventureID)?.[0];
        MyDom.fillForm("#adventureDetailsForm", adventure);   
        
        loadAdventureFilesByID(adventureID);

        MyDom.hideContent(".hideOnAdventureSelected");
        MyDom.showContent(".showOnAdventureSelected");

        // Set adventure options in the 
        var advOpts = await MyTemplates.getTemplateAsync("templates/options/adventure-option.html", MyPageManager.getContent("Adventures"));
        MyDom.setContent("#fileModalForm #adventure", {"innerHTML": advOpts});

    } catch(err){
        console.error(err);
    }

}

// Adding a new template
async function onNewAdventure(){
    MyDom.hideContent("#newAdventureButton");
    MyDom.showContent("#newAdventureNameInputSection");
}

// Adding a new adventure
async function onAddAdventure(){
    var adventureID = MyHelper.getCode(22, "mix")?.toLowerCase();
    var adventureName = MyDom.getContent("#newAdventureName")?.value ?? "";
    if(adventureName == ""){
        MyPageManager.errorMessage("Adventure name is required");
        return;
    }
    var adventure = new Adventure({ 
        "adventureID": adventureID, 
        "name": adventureName, 
        "status": "Draft" });
    MyPageManager.addContent("Adventures", [adventure]);
    var adventureListItem = await MyTemplates.getTemplateAsync("templates/lists/adventure-list.html", adventure);
    MyDom.setContent("#listOfAdventures", {"innerHTML": adventureListItem}, true);
    MyDom.showContent("#newAdventureButton");
    MyDom.hideContent("#newAdventureNameInputSection");
}

// Load the adventure files based on an advenure ID
async function loadAdventureFilesByID(adventureID) {
    try {
        MyDom.showContent(".showOnFilesLoading");
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": ""});
        var adventureVideos = [];
        if(adventureID != ""){
            adventureVideos = (adventureID == "0") 
                                ? await MyFetch.call("GET", "https://files.dejaithekid.com/stream/unassigned") 
                                : await MyCloudFlare.GetVideos(adventureID);
        }
        var streamVideos = adventureVideos.map( vid => new StreamVideo(vid));
        streamVideos.sort( (a,b) => { return a.Order - b.Order });
        MyPageManager.addContent("Files", streamVideos);
        var templateName = streamVideos.length > 0 ? "file-row" : "file-row-empty";
        var fileRowsTemplate = await MyTemplates.getTemplateAsync(`templates/rows/${templateName}.html`, streamVideos);
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": fileRowsTemplate});
        MyDom.showContent(".showOnFilesLoaded");
        MyDom.hideContent(".hideOnFilesLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSaveAdventureDetails(){
    try {
        var formDetails = MyDom.getFormDetails("#adventureDetailsForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }
        var adventure = MyPageManager.getContent("Adventures")?.filter(x => x.AdventureID == fields?.adventureID)?.[0];
        if(adventure){
            adventure.update(fields);
        }
        
        // Submit this one to be saved in Cloudflare
        var results = await MyFetch.call("POST", `${MyCloudFlare.Endpoint}/adventure/`, { body: JSON.stringify(fields)} );
        MyPageManager.setResultsMessage(results);

        // Add adventures to be synced
        MyPageManager.addToBySynced("adventures");

    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }
}

// Open the modal
function onSelectFile(cell){
    row = cell.closest("tr");
    var contentID = row?.getAttribute("data-content-id") ?? "";
    if (contentID != "") {
        onSetSelectedRow(row);
        MyDom.setContent("#previewTimePercent", {"value": "0"});
        var file = MyPageManager.getContent("Files")?.filter(x => x.ContentID == contentID)?.[0];
        MyDom.fillForm("#fileModalForm", file);
        MyDom.addClass("#fileFormModal.modalContainer", "open");
    }
}

// Close the modal
function onCloseModal(refesh=false){
    MyDom.removeClass(".modalContainer", "open");
    if(refesh){
        var advID = MyUrls.getSearchParam("content") ?? "";
        loadAdventureFilesByID(advID);
    }
}

// Save the edits to a fieldl (and entire row)
async function onSaveFile(closeModal=false) {
    try {
        var formDetails = MyDom.getFormDetails("#fileModalForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];
        
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }

        // Submit this one to be saved in Cloudflare
        var results = { "status": 400 };
        var videoID = fields?.contentID;
        var results = await MyFetch.call("POST", `${MyCloudFlare.Endpoint}/stream/?video=${videoID}`, { body: JSON.stringify(fields)} );
        if( (results?.status ?? 400) == 200 ) {
            MyPageManager.successMessage("File details saved!");
        } else {
            MyPageManager.errorMessage(results?.message + " " + results?.data, 10);
        }

        // Determine if to close modal or go next
        var saveAndNext = document.querySelector("#nextFile")?.checked ?? false;
        if(saveAndNext){ 
            onNavigateFile("next");
        } else { 
            onCloseModal(true);
        }
    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }
}

// Set the currently selected file row
function onSetSelectedRow(row){
    MyDom.removeClass("tr.selectedRow", "selectedRow");
    row.classList.add("selectedRow");
}

// Go to the prev file
async function onNavigateFile(direction="next"){
    var rows = Array.from(document.querySelectorAll("#adventureFiles .fileRow"));
    var contentIDs = rows.map(x => x.getAttribute("data-content-id"));
    var currRow = rows.filter(x => x.classList.contains("selectedRow"))?.[0]?.getAttribute("data-content-id") ?? "";
    var rowIdx = contentIDs.indexOf(currRow);
    var nextRow = (direction == "next") ? rows[rowIdx+1] : (direction == "prev") ? rows[rowIdx-1] : undefined;
    if(nextRow != undefined){
        nextRow.querySelector(".fieldCell").click();
    } else { 
        MyDom.setContent("#navMessage", {"innerText": "Reached end of the list."});
        setTimeout( ()=> {
            MyDom.setContent("#navMessage", {"innerText": ""});
        }, 2000);
    }
}

// Save the open file and move to the next
async function onSaveAndNext(){
    var rows = Array.from(document.querySelectorAll("#adventureFiles .fileRow"));
    var contentIDs = rows.map(x => x.getAttribute("data-content-id"));
    var numRows = rows.length;
    var currRow = rows.filter(x => x.classList.contains("selectedRow"))?.[0]?.getAttribute("data-content-id") ?? "";
    var rowIdx = contentIDs.indexOf(currRow);
    var closeAfter = (rowIdx == numRows-1);
    await onSaveFile(closeAfter);
    if(!closeAfter){
        rows[rowIdx+1]?.querySelector(".fieldCell").click();
    }
}

// Generate a preview time based on duration
function onGeneratePreview(){
    var time = "0m0s"
    try { 
        var duration = MyDom.getContent("#fileDuration")?.value ?? "";
        var percent = MyDom.getContent("#previewTimePercent")?.value ?? "";
        if(duration == "" || percent == ""){
            throw new Error("Missing duration or percent");
        }
        percent = Number(percent);
        duration = Number(duration);
        // Get percentage of duration
        var percentage = percent / 100;
        var videoTime = Math.floor( (duration * percentage) );
        // var quarterWay = Math.floor( (duration * 0.25) );
        var minute = Math.floor( (videoTime / 60) );
        var seconds = Math.ceil( (videoTime % 60) );
        time = `${minute}m${seconds}s`;
    } catch(err){
        console.error(err);
    } finally {
        MyDom.setContent("#preview", {"value": time});
    }
}
