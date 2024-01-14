

// Get the list of paths
async function onGetPaths(){
    var paths = await MyCloudFlare.KeyValues("GET", "/paths");
    paths = paths.map(result => new Path(result));
    MyPageManager.addContent("Paths", paths);

    // Load content after getting
    await onLoadPaths();
    loadTabFromUrl("paths");
}

// LOAD: Adding the formatted content to the page (may be hidden)
async function onLoadPaths(){
    var paths = MyPageManager.getContentByKey("Paths");
    paths.sort( (a, b) => { return a.Key.localeCompare(b.Key) });
    var pathList = await MyTemplates.getTemplateAsync("templates/lists/path-list.html", paths);
    MyDom.setContent("#listOfPaths", {"innerHTML": pathList});
}

// SHOW: Showing the entity when the tab is clicked
async function onShowPaths() {
    try {
        onSetActiveTab("paths");
        loadContentFromURL();

        // Add user search bar
        MySearcher.addSearchBar("Paths", "#listOfPaths", "#searchPaths");
        
        MyDom.hideContent(".hideOnPathsLoaded");
        MyDom.showContent(".showOnPathsLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Path & its files
async function onSelectPath(option){
    try {
        var key = option.getAttribute("data-path-key") ?? "";
        MyUrls.modifySearch({"tab" : "paths", "content":key});
        var path = MyPageManager.getContentByKey("Paths")?.filter(x => x.Key == key)?.[0];
        MyDom.fillForm("#pathDetailsForm", path);

        onSetSelectedEntity(key);
        
        MyDom.hideContent(".hideOnPathSelected");
        MyDom.showContent(".showOnPathSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSavePathDetails(button){

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    try {

        // Get fields
        var formDetails = MyDom.getFormDetails("#pathDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            saveStatus.error(errorMessage);
            return;
        }
        fields["value"] = encodeURIComponent(fields["path"]);

        // Update existing or add new path
        var path = MyPageManager.getContentByKey("Paths")?.filter(x => x.Key == fields.key)?.[0];
        if(path != undefined){
            path.update(fields);
        } else {
            var newPath = new Path(fields);
            MyPageManager.addContent("Paths", newPath);
            MyUrls.modifySearch({"content":fields.key});
        }

        // Save changes in cloudflare
        var results = await MyCloudFlare.KeyValues("POST", "/path", { body: JSON.stringify(fields) });
        saveStatus.results(results);

        // Reload list of paths
        onShowPaths();

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 10);
    }
}

async function onAddPath(){
    var pathCode = MyHelper.getCode(5);
    MyDom.fillForm("#pathDetailsForm", { "Key": pathCode });
    MyDom.hideContent(".hideOnPathSelected");
    MyDom.showContent(".showOnPathSelected");
    onSetSelectedEntity(pathCode);
}