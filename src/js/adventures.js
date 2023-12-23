// Get the list of adventures
async function getListOfAdventures(){
    var adventures = await MyFetch.call("GET", `https://files.dejaithekid.com/adventures/?key=manage`);
    adventures = adventures.map(result => new Adventure(result));
    adventures.sort( (a, b) => { return a.Name.localeCompare(b.Name) });
    MyPageManager.addContent("Adventures", adventures);
    return adventures;
}

// Show the list of adventures
async function onShowAdventures() {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var adventureList = await MyTemplates.getTemplateAsync("templates/lists/adventure-list.html", MyPageManager.getContent("Adventures") );
        MyDom.setContent("#listOfAdventures", {"innerHTML": adventureList});

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
    var adventureID = option.getAttribute("data-adventure-id") ?? "";
    loadAdventureByID(adventureID);     
    loadAdventureFilesByID(adventureID);
    MyDom.hideContent(".hideOnAdventureSelected");
    MyDom.showContent(".showOnAdventureSelected");
}

// Load the adventure based on its adventure ID
async function loadAdventureByID(adventureID){
    try {
        var adventure = MyPageManager.getContent("Adventures")?.filter(x => x.AdventureID == adventureID)?.[0];
        MyDom.fillForm("#adventureDetailsForm", adventure);
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Load the adventure files based on an advenure ID
async function loadAdventureFilesByID(adventureID) {
    try {
        MyDom.showContent(".showOnFilesLoading");
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": ""});
        var adventureVideos = adventureID == "" ? [] : await MyCloudFlare.GetVideos(adventureID);
        var streamVideos = adventureVideos.map( vid => new StreamVideo(vid));
        streamVideos.sort( (a,b) => { return a.Order - b.Order });
        MyPageManager.addContent("Files", streamVideos);
        var templateName = streamVideos.length > 0 ? "file-row" : "file-row-empty";
        var fileRowsTemplate = await MyTemplates.getTemplateAsync(`templates/rows/${templateName}.html`, streamVideos);
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": fileRowsTemplate});
        MyDom.showContent(".hideOnFilesLoaded");
        MyDom.hideContent(".hideOnFilesLoaded");
        var _modifyUrl = (adventureID != "") ? MyUrls.modifySearch({"tab" : "adventure", "id":adventureID}) : MyUrls.modifySearch({});
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
            setNotifyMessage(errorMessage, 10);
            return;
        }
        var adventure = MyPageManager.getContent("Adventures")?.filter(x => x.AdventureID == fields?.adventureID)?.[0];
        if(adventure){
            adventure.update(fields);
        }
        // Submit this one to be saved in Cloudflare
        var results = await MyFetch.call("POST", `${MyCloudFlare.Endpoint}/adventure/`, { body: JSON.stringify(fields)} );
        if( (results?.status ?? 400) == 200 ) {
            setNotifyMessage("Adventure details saved!");
        } else {
            setNotifyMessage(results?.message + " " + results?.data, 10);
        }
    } catch(err){
        MyLogger.LogError(err);
        setNotifyMessage(err.Message, 10);
    }
}

// Sync the adventures
async function onSyncAdventures(){
    var results = await MyFetch.call("GET", `${MyCloudFlare.Endpoint}/adventures/sync`);
    console.log(results);
    setNotifyMessage(results?.Message ?? "Sync done?", 10);
}


// Open the modal
function onOpenModal(cell){
    row = cell.closest("tr");
    var contentID = row?.getAttribute("data-content-id") ?? "";
    if (contentID != "") {
        var file = MyPageManager.getContent("Files")?.filter(x => x.ContentID == contentID)?.[0];
        console.log(file);
        MyDom.fillForm("#fileModalForm", file);
        MyDom.addClass("#fileFormModal.modalContainer", "open");
    }
}

// Close the modal
function onCloseModal(){
    MyDom.removeClass(".modalContainer", "open");
}

// Save the edits to a fieldl (and entire row)
async function onSaveFile() {
    try {
        var formDetails = MyDom.getFormDetails("#fileModalForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];
        
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            setNotifyMessage(errorMessage, 10);
            return;
        }
        console.log(fields);

        // Submit this one to be saved in Cloudflare
        var results = { "status": 400 };
        var videoID = fields?.contentID;
        var results = await MyFetch.call("POST", `${MyCloudFlare.Endpoint}/stream/?video=${videoID}`, { body: JSON.stringify(fields)} );
        if( (results?.status ?? 400) == 200 ) {
            setNotifyMessage("File details saved!");
        } else {
            setNotifyMessage(results?.message + " " + results?.data, 10);
        }
        onCloseModal();
    } catch(err){
        MyLogger.LogError(err);
        setNotifyMessage(err.Message, 10);
    }
}
