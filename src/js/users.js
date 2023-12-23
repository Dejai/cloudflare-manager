

// Get the list of users
async function getListOfUsers(){
    var users = await MyFetch.call("GET", `https://files.dejaithekid.com/users/`);
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
        console.log(key);
        var user = MyPageManager.getContent("Users")?.filter(x => x.UserKey == key)?.[0];
        MyDom.fillForm("#userDetailsForm", user);

        var accessDetails = await MyFetch.call("GET", `https://files.dejaithekid.com/access/?key=${key}`);
        var userAccess = new UserAccess(accessDetails);
        var accessList = userAccess.getAccessList();
        var usersTemplate = await MyTemplates.getTemplateAsync("templates/rows/user-row.html", accessList);
        MyDom.setContent("#listOfAccess", {"innerHTML": usersTemplate} );
    } catch (err) {
        MyLogger.LogError(err);
    }

    MyDom.hideContent(".hideOnUserSelected");
    MyDom.showContent(".showOnUserSelected");
}

// Save Adventure details
async function  onSaveUserDetails(){
    try {
        console.log("Coming soon");
    } catch(err){
        MyLogger.LogError(err);
        setNotifyMessage(err.Message, 10);
    }
}