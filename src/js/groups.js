

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
        MyDom.hideContent(".hideOnGroupsLoaded");
        MyDom.showContent(".showOnGroupsLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Group & its files
async function onSelectGroup(option){
    try {
        var key = option.getAttribute("data-group-key") ?? "";
        var group = MyPageManager.getContent("Groups")?.filter(x => x.GroupKey == key)?.[0];
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
        console.log("Coming soon");
    } catch(err){
        MyLogger.LogError(err);
        setNotifyMessage(err.Message, 10);
    }
}