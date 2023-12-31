

// Get the list of paths
async function getListOfPaths(){
    var paths = await MyCloudFlare.KeyValues("GET", "/paths");
    paths = paths.map(result => new Path(result));
    paths.sort( (a, b) => { return a.Key.localeCompare(b.Key) });
    MyPageManager.addContent("Paths", paths);
}

async function onShowPaths() {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var pathList = await MyTemplates.getTemplateAsync("templates/lists/path-list.html", MyPageManager.getContent("Paths") );
        MyDom.setContent("#listOfPaths", {"innerHTML": pathList});
        onSetActiveTab("paths");
        loadContentFromURL();

        // Add user search bar
        MySearcher.addSearchBar("Paths", "#listOfPaths", "#searchPaths");
        
        MyDom.hideContent(".hideOnPathsLoaded");
        MyDom.showContent(".showOnPathsLoaded");
        loadContentFromURL();
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Path & its files
async function onSelectPath(option){
    try {
        var key = option.getAttribute("data-path-key") ?? "";
        MyUrls.modifySearch({"tab" : "paths", "content":key});
        var path = MyPageManager.getContent("Paths")?.filter(x => x.Key == key)?.[0];
        MyDom.fillForm("#pathDetailsForm", path);
        MyDom.hideContent(".hideOnPathSelected");
        MyDom.showContent(".showOnPathSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSavePathDetails(){
    try {
        var formDetails = MyDom.getFormDetails("#pathDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }

        // Save changes in cloudflare
        fields["value"] = encodeURIComponent(fields["path"]);
        var results = await MyCloudFlare.KeyValues("POST", "/path", { body: JSON.stringify(fields) });
        MyPageManager.setResultsMessage(results);

    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }
}

async function onAddPath(){
    MyDom.fillForm("#pathDetailsForm", {});
    MyDom.hideContent(".hideOnPathSelected");
    MyDom.showContent(".showOnPathSelected");
}