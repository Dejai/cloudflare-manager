

// Get the list of groups
async function getListOfGroups(){
    var groups = await MyFetch.call("GET", `https://files.dejaithekid.com/groups/`);
    groups = groups.map(result => new Group(result));
    groups.sort( (a, b) => { return a.Name.localeCompare(b.Name) });
    MyPageManager.addContent("Groups", groups);
}

async function onShowGroups() {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var groupList = await MyTemplates.getTemplateAsync("templates/lists/group-list.html", MyPageManager.getContent("Groups") );
        MyDom.setContent("#listOfGroups", {"innerHTML": groupList});
        onSetActiveTab("groups");
        loadContentFromURL();
        MyDom.hideContent(".hideOnGroupsLoaded");
        MyDom.showContent(".showOnGroupsLoaded");
        loadContentFromURL();
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Group & its files
async function onSelectGroup(option){
    try {
        var key = option.getAttribute("data-group-key") ?? "";
        MyUrls.modifySearch({"tab" : "groups", "content":key});
        var group = MyPageManager.getContent("Groups")?.filter(x => x.Key == key)?.[0];
        MyDom.fillForm("#groupDetailsForm", group);
        MyDom.hideContent(".hideOnGroupSelected");
        MyDom.showContent(".showOnGroupSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSaveGroupDetails(){
    try {
        var formDetails = MyDom.getFormDetails("#groupDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }

        // Save changes in cloudflare
        var results = await MyFetch.call("POST", "https://files.dejaithekid.com/group", { body: JSON.stringify(fields) });
        MyPageManager.setResultsMessage(results);

    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }
}

async function onAddGroup(){
    MyDom.fillForm("#groupDetailsForm", {});
    MyDom.hideContent(".hideOnGroupSelected");
    MyDom.showContent(".showOnGroupSelected");
}