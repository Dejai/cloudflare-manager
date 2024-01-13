
// Get the list of adventures
async function onGetAdventures(){
    // Sync the adventures
    await onSyncEntity("Adventures");

    var adventures = await MyCloudFlare.Files("GET", "/adventures");
    adventures = adventures.map(result => new Adventure(result));
    adventures.push(new Adventure({"name": "_Default", "adventureID": 0}));
    MyPageManager.addContent("Adventures", adventures);

    onLoadAdventures();
}

// LOAD: Adding the formatted content to the page (may be hidden)
async function onLoadAdventures(){
    var adventures = MyPageManager.getContentByKey("Adventures");
    adventures.sort( (a, b) => { return a.Name.localeCompare(b.Name) });
    var adventureList = await MyTemplates.getTemplateAsync("templates/lists/adventure-list.html", adventures );
    MyDom.setContent("#listOfAdventures", {"innerHTML": adventureList});
}

// SHOW: Showing the entity when the tab is clicked
async function onShowAdventures() {
    try {
        onSetActiveTab("adventures");
        loadContentFromURL();
        
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
        // Set the group options in the adventure details form
        var groupOpts = await MyTemplates.getTemplateAsync("templates/options/group-option.html", MyPageManager.getContentByKey("Groups"));
        MyDom.setContent("#adventureDetailsForm #accessGroup", {"innerHTML": "<option></option>" + groupOpts});
        
        var adventureID = option.getAttribute("data-adventure-id") ?? "";
        MyUrls.modifySearch({"tab" : "adventures", "content":adventureID});
        var adventure = MyPageManager.getContentByKey("Adventures")?.filter(x => x.AdventureID == adventureID)?.[0];
        MyDom.fillForm("#adventureDetailsForm", adventure);   
        
        loadAdventureFilesByID(adventureID);
        onSetSelectedEntity(adventureID);

        MyDom.hideContent(".hideOnAdventureSelected");
        MyDom.showContent(".showOnAdventureSelected");

        // Set adventure options in the 
        var advOpts = await MyTemplates.getTemplateAsync("templates/options/adventure-option.html", MyPageManager.getContentByKey("Adventures"));
        MyDom.setContent("#fileModalForm #adventure", {"innerHTML": advOpts});

    } catch(err){
        MyLogger.LogError(err);
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
        var adventure = MyPageManager.getContentByKey("Adventures")?.filter(x => x.AdventureID == fields?.adventureID)?.[0];
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

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 7);
    }
}

// Sync the adventures
async function onSyncAdventures(){
    MyPageManager.infoMessage("Syncing Adventures", -1);
    var results = await MyCloudFlare.Files("GET", `/adventures/sync`);
    MyPageManager.setResultsMessage(results);
    MyPageManager.removeContent("Adventures");
    await onGetAdventures();
    // Reload if current tab
    var tab = MyUrls.getSearchParam("tab") ?? "";
    if(tab == "adventures"){
        onShowAdventures();
    }
}
