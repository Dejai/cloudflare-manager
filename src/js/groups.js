

// Get the list of groups
async function getListOfGroups(){
    var groups = await MyCloudFlare.KeyValues("GET", "/groups");
    groups = groups.map(result => new Group(result));
    MyPageManager.addContent("Groups", groups);
}

// Select Groups tab
function onGroupsTab(){
    MyDom.hideContent(".hideOnTabSwitch");
    onShowGroups();
}

async function onShowGroups() {
    try {
        var groups = MyPageManager.getContent("Groups");
        groups.sort( (a, b) => { return a.Value.localeCompare(b.Value) });
        var groupList = await MyTemplates.getTemplateAsync("templates/lists/group-list.html", groups );
        MyDom.setContent("#listOfGroups", {"innerHTML": groupList});

        onSetActiveTab("groups");
        loadContentFromURL();

        MyDom.showContent(".showOnGroupsLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Group & its files
async function onSelectGroup(option){
    try {
        var key = option.getAttribute("data-group-key") ?? "";
        MyUrls.modifySearch({"tab" : "groups", "content":key});
        var group = MyPageManager.getContent("Groups")?.filter(x => x.Key == key)?.[0] ?? {};
        MyDom.fillForm("#groupDetailsForm", group);

        onSetSelectedEntity(key);

        MyDom.hideContent(".hideOnGroupSelected");
        MyDom.showContent(".showOnGroupSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function onSaveGroupDetails(button){

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    try {
        // Get form details
        var formDetails = MyDom.getFormDetails("#groupDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            saveStatus.error(errorMessage);
            return;
        }

        // Get/update existing group or add a new one.
        var group = MyPageManager.getContent("Groups")?.filter(x => x.Key == fields.key)?.[0];
        if(group != undefined){
            group.update(fields);
        } else {
            var newGroup = new Group(fields);
            MyPageManager.addContent("Groups", newGroup);
            MyUrls.modifySearch({"content":fields.key});
        }

        // Save changes in cloudflare
        var results = await MyCloudFlare.KeyValues("POST", "/group", { body: JSON.stringify(fields) });
        saveStatus.results(results, "Group");

        // Reload the list of groups after adding the group; 
        await onShowGroups();

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.Message, 7);
    }
}

// Add a new group
async function onAddGroup(){
    MyDom.fillForm("#groupDetailsForm", {});
    onSetSelectedEntity();
    MyDom.hideContent(".hideOnGroupSelected");
    MyDom.showContent(".showOnGroupSelected");
    MyUrls.replaceSearch({"tab" : "groups" });
}
