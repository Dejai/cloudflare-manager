

// Get the list of users
async function getListOfUsers(){
    var users = await MyFetch.call("GET", `https://files.dejaithekid.com/users/`);
    console.log(users);
    users = users.map(result => new User(result));
    users.sort( (a, b) => { return a.UserKey.localeCompare(b.UserKey) });
    MyPageManager.addContent("Users", users);
}

async function onShowUsers() {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var userList = await MyTemplates.getTemplateAsync("templates/lists/user-list.html", MyPageManager.getContent("Users") );
        MyDom.setContent("#listOfUsers", {"innerHTML": userList});
        MyDom.hideContent(".hideOnUsersLoaded");
        MyDom.showContent(".showOnUsersLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the User & its files
async function onSelectUser(option){
    try {
        var key = option.getAttribute("data-user-key") ?? "";
        var user = MyPageManager.getContent("Users")?.filter(x => x.UserKey == key)?.[0];
        MyDom.fillForm("#userDetailsForm", user);
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
    var accessDetails = await MyFetch.call("GET", `https://files.dejaithekid.com/access/?key=${userKey}`);
    var userAccess = new UserAccess(accessDetails);
    MyPageManager.addContent("Access-"+userKey, userAccess);
    var accessList = userAccess.getAccessList();
    var usersTemplate = await MyTemplates.getTemplateAsync("templates/rows/access-row.html", accessList);
    MyDom.setContent("#listOfAccess", {"innerHTML": usersTemplate} );
    MyDom.hideContent(".hideOnAccessLoaded");
}

// Sync the adventures
async function onSyncUsersAndAccess(){
    try {
        MyPageManager.infoMessage("Syncing users ...");
        var results = await MyFetch.call("GET", `${MyCloudFlare.Endpoint}/users/sync`);
        MyPageManager.success(results?.Message ?? "Sync 1 done?");
    } catch(errO){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }

}


// Add a new access
async function onSaveAccess(){
    try {
        var details = MyDom.getFormDetails("#accessForm");
        var errors = details?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }
        var userKey = MyDom.getContent("#addAccessButton")?.value;
        var accessKey = "Access-" + userKey;
        var userAccess = MyPageManager.getContent(accessKey)?.Access ?? undefined;
        if(userAccess != undefined){
            var fields = details?.fields ?? "";
            var scope = fields?.scope?.toLowerCase();
            var group = fields?.group?.toLowerCase();
            userAccess[scope] = group;

            // Save this access
            var results = await MyFetch.call("POST", `https://files.dejaithekid.com/access/?key=${userKey}`, { body: JSON.stringify(userAccess)});
            MyPageManager.setResultsMessage(results);

            // Add access to be synced
            MyPageManager.addToBySynced("access");
            
            onCloseAccessModal();
            
        }
    } catch(err){
        MyLogger.LogError(err);
    }
}

async function onOpenAccessModal(){
    var groups = MyPageManager.getContent("Groups");
    var groupOpts = await MyTemplates.getTemplateAsync("templates/options/group-option.html", groups);
    MyDom.setContent("#accessForm #group", {"innerHTML": "<option></option>" + groupOpts});
    MyDom.addClass("#accessFormModal.modalContainer", "open");
}

function onCloseAccessModal(){
    MyDom.removeClass(".modalContainer", "open");
}