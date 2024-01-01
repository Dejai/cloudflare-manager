// Get the list of adventures
async function getListOfAdventures(){
    var adventures = await MyCloudFlare.Files("GET", "/adventures");
    adventures = adventures.map(result => new Adventure(result));
    adventures.push(new Adventure({"name": "_Default", "adventureID": 0}));
    MyPageManager.addContent("Adventures", adventures);
    return adventures;
}

// Select adventures tab
function onAdventuresTab(){
    MyDom.hideContent(".hideOnTabSwitch");
    onShowAdventures();
}

// Show the list of adventures
async function onShowAdventures() {
    try {
        var adventures = MyPageManager.getContent("Adventures");
        adventures.sort( (a, b) => { return a.Name.localeCompare(b.Name) });
        var adventureList = await MyTemplates.getTemplateAsync("templates/lists/adventure-list.html", adventures );
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
        onSetSelectedEntity(adventureID);

        MyDom.hideContent(".hideOnAdventureSelected");
        MyDom.showContent(".showOnAdventureSelected");

        // Set adventure options in the 
        var advOpts = await MyTemplates.getTemplateAsync("templates/options/adventure-option.html", MyPageManager.getContent("Adventures"));
        MyDom.setContent("#fileModalForm #adventure", {"innerHTML": advOpts});

    } catch(err){
        console.error(err);
    }

}

// Add a new group
async function onAddAdventure(){
    var adventureID = MyHelper.getCode(22, "mix")?.toLowerCase();
    MyDom.fillForm("#adventureDetailsForm", { "AdventureID": adventureID } );
    MyDom.hideContent(".hideOnAdventureSelected");
    MyDom.showContent(".showOnAdventureSelected");
    MyUrls.replaceSearch({"tab" : "adventures" });
    loadAdventureFilesByID(adventureID);
    onSetSelectedEntity(adventureID);
}

// Load the adventure files based on an advenure ID
async function loadAdventureFilesByID(adventureID) {
    try {
        MyDom.showContent(".showOnFilesLoading");
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": ""});
        var adventureVideos = (adventureID != "") ? await MyCloudFlare.Files("GET",`/stream/?search=${adventureID}`) : [];
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
async function  onSaveAdventureDetails(button){

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();
    
    try {
        // Get form details
        var formDetails = MyDom.getFormDetails("#adventureDetailsForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];

        // If _Default, just return
        if(fields?.adventureID == 0){
            saveStatus.info("Cannot save _Default adventure", 3);
            return;
        }
        if(errors.length > 0){
            var errorMessage = errors.join(" / ");
            saveStatus.error(errorMessage);
            return;
        }

        // Update existing or add new adventure
        var adventure = MyPageManager.getContent("Adventures")?.filter(x => x.AdventureID == fields?.adventureID)?.[0];
        if(adventure != undefined){
            adventure.update(fields);
        } else { 
            var newAdventure = new Adventure(fields);
            MyPageManager.addContent("Adventures", newAdventure);
            MyUrls.modifySearch({"content": newAdventure.AdventureID});
        }

        // Submit this one to be saved in Cloudflare
        var results = await MyCloudFlare.Files("POST", `/adventure/`, { body: JSON.stringify(fields)} );
        saveStatus.results(results, "Adventure");

        // Reload the list after saving.
        onShowAdventures();

        // Add adventures to be synced
        MyPageManager.addToBySynced("adventures");

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 7);
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
async function onSaveFile(button) {

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    try {
        var formDetails = MyDom.getFormDetails("#fileModalForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];
        
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            saveStatus.error(errorMessage);
            return;
        }

        // Submit this one to be saved in Cloudflare
        var results = { "status": 400 };
        var videoID = fields?.contentID;
        var results = await MyCloudFlare.Files("POST", `/stream/?video=${videoID}`, { body: JSON.stringify(fields)} );
        var message = results?.message ?? "OK";
        if(message != "OK"){
            throw new Error(message);
        }
        saveStatus.results(results, "File");

        // Determine if to close modal or go next
        setTimeout( ()=> {
            var saveAndNext = document.querySelector("#nextFile")?.checked ?? false;
            if(saveAndNext){ 
                onNavigateFile("next");
                MyDom.setContent("#nextFile", {"checked":""});
            } else { 
                onCloseModal(true);
            }
        }, 2000);

        
    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 7);
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
