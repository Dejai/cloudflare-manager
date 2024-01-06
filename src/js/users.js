

// Get the list of users
async function onGetListOfUsers(){
    var users = await MyCloudFlare.Files("GET", "/users");
    users = users.map(result => new User(result));
    users.sort( (a, b) => { return a.UserKey.localeCompare(b.UserKey) });
    MyPageManager.addContent("Users", users);
}

// Click on the users tab
function onUsersTab(){
    MyDom.hideContent(".hideOnTabSwitch");
    onShowUsers();
}

// Show the list of users
async function onShowUsers() {
    try {
        var userList = await MyTemplates.getTemplateAsync("templates/lists/user-list.html", MyPageManager.getContentByKey("Users") );
        MyDom.setContent("#listOfUsers", {"innerHTML": userList});
        onSetActiveTab("users");
        loadContentFromURL();

        // Add user search bar
        MySearcher.addSearchBar("Users", "#listOfUsers", "#searchUsers");
        
        MyDom.hideContent(".hideOnUsersLoaded");
        MyDom.showContent(".showOnUsersLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Select a user from the list & show their details
async function onSelectUser(option){
    try {
        var key = option.getAttribute("data-user-key") ?? "";
        MyUrls.modifySearch({"tab" : "users", "content":key});
        var user = MyPageManager.getContentByKey("Users")?.filter(x => x.UserKey == key)?.[0];
        MyDom.fillForm("#userDetailsForm", user);
        MyDom.setContent("#addAccessButton", {"value": key} );
        onSetSelectedEntity(key);
        onGetAccessByUserKey(key);  
    } catch (err) {
        MyLogger.LogError(err);
    }
    MyDom.hideContent(".hideOnUserSelected");
    MyDom.showContent(".showOnUserSelected");
}

// Get access by user key
async function onGetAccessByUserKey(userKey){
    MyDom.showContent(".showOnAccessLoading");
    MyDom.setContent("#listOfAccess", {"innerHTML": ""} );
    var accessDetails = await MyCloudFlare.Files("GET", `/access/?key=${userKey}`);
    var userAccess = new UserAccess(accessDetails);
    MyPageManager.addContent("Access-"+userKey, userAccess);
    var accessList = userAccess.getAccessList();
    var usersTemplate = await MyTemplates.getTemplateAsync("templates/rows/access-row.html", accessList);
    MyDom.setContent("#listOfAccess", {"innerHTML": usersTemplate} );
    MyDom.hideContent(".hideOnAccessLoaded");
}

// Add a new access
async function onSaveAccess(button){

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    try {
        var details = MyDom.getFormDetails("#accessForm");
        var errors = details?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            saveStatus.error(errorMessage);
            return;
        }
        var userKey = MyDom.getContent("#addAccessButton")?.value;
        var accessKey = "Access-" + userKey;
        var userAccess = MyPageManager.getContentByKey(accessKey)?.Access ?? undefined;
        if(userAccess == undefined){
            throw new Error("UserKey is undefined");
        }

        var fields = details?.fields ?? "";
        var scope = fields?.scope?.toLowerCase();
        var group = fields?.group?.toLowerCase();
        userAccess[scope] = group;

        // Save this access
        var results = await MyCloudFlare.Files("POST", `/access/?key=${userKey}`, { body: JSON.stringify(userAccess)});
        var message = results?.message ?? "OK"
        if(message != "OK"){
            throw new Error(message);
        }
        saveStatus.results(results);

        setTimeout( () => {
            onCloseAccessModal();
            onGetAccessByUserKey(userKey);
        }, 1000);

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message);
    }
}

async function onOpenAccessModal(){
    var groups = MyPageManager.getContentByKey("Groups");
    var groupOpts = await MyTemplates.getTemplateAsync("templates/options/group-option.html", groups);
    MyDom.setContent("#accessForm #group", {"innerHTML": "<option></option>" + groupOpts});
    MyDom.addClass("#accessFormModal.modalContainer", "open");
}

function onCloseAccessModal(){
    MyDom.removeClass(".modalContainer", "open");
}

// Sync the adventures
async function onSyncUsers(){
    MyPageManager.infoMessage("Syncing Users", -1);
    var results = await MyCloudFlare.Files("GET", `/users/sync`);
    MyPageManager.setResultsMessage(results);
    MyPageManager.removeContent("Users");
    await onGetListOfUsers();
    // Reload if current tab
    var tab = MyUrls.getSearchParam("tab") ?? "";
    if(tab == "users"){
        onShowUsers();
    }
}