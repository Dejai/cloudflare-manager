
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyCloudFlare = new CloudflareWrapper();
const MyPageManager = new PageManager();
const MySyncManager = new SyncManager();

const savingMessages = {
    "saving": "<span style='color:lightgray'>Saving changes ... </span>",
    "success": "<span style='color:limegreen'>SAVED!</span>",
    "fail": "<span style='color:red'>FAILED!</span>"
}

/*********************** GETTING STARTED *****************************/

// Once doc is ready
MyDom.ready( async () => {

    // Get the login details
    var loginDetails = await MyAuth.onGetLoginDetails();
    var actionText = (loginDetails.IsLoggedIn) ? "Hi, " + loginDetails.FirstName : "Log in";
    var authAction = (loginDetails.IsLoggedIn) ? "logout" : "login";
    MyDom.setContent("#loginAction", { "innerHTML": actionText });
    MyDom.setContent("#authLink", { "data-auth-action": authAction });

    try {

        // Check if logged in
        if(!loginDetails.IsLoggedIn){
            MyDom.showContent("#headerContent #loginRequired");
            throw new Error("Login required");
        }

        // Check if manager
        var manager = await MyCloudFlare.Files("GET", "/manager");
        if(!(manager?.results ?? false)){
            MyDom.showContent("#unauthorized");
            throw new Error("Unauthorized");
        }


        // Load the different tabs
        var tabs = Array.from(document.querySelectorAll(".cf-manage-tab"));
        var contentFuncs = {
            "adventures": getListOfAdventures(),
            "events": getListOfEvents(),
            "groups": getListOfGroups(),
            "users": onGetListOfUsers(),
            "paths": getListOfPaths()
        }
        for(var tab of tabs)
        {
            var tabName = tab.getAttribute("data-tab-name");
            var func = contentFuncs[tabName] ?? undefined;
            var templateName = tabName.substring(0, tabName.length-1);
            if(func != undefined){
                await func;
            }
            var section = await MyTemplates.getTemplateAsync(`templates/sections/${templateName}-section.html`, {});
            MyDom.setContent("#mainContentSection", {"innerHTML": section }, true);
            MyDom.showContent(`#headerContent .tab[data-tab-name="${tabName}"]`);
        }

        // Load the content


        // Load the adventures
        // await getListOfAdventures();
        // var adventureSection = await MyTemplates.getTemplateAsync("templates/sections/adventure-section.html", {});
        // MyDom.setContent("#mainContentSection", {"innerHTML": adventureSection }, true);
        // MyDom.showContent('#headerContent .tab[data-tab-name="adventures"]');

        // Load the events
        // await getListOfAdventures();
        // var eventSection = await MyTemplates.getTemplateAsync("templates/sections/event-section.html", {});
        // MyDom.setContent("#mainContentSection", {"innerHTML": eventSection }, true);
        // MyDom.showContent('#headerContent .tab[data-tab-name="events"]');

        // Add form for adventure
        // var adventureForm = await MyTemplates.getTemplateAsync("templates/forms/file-edit-form.html", {});
        // MyDom.setContent("#modalSection", {"innerHTML": adventureForm}, true);
        
        // // Load the Groups
        // await getListOfGroups();
        // var groupSection = await MyTemplates.getTemplateAsync("templates/sections/group-section.html", {});
        // MyDom.setContent("#mainContentSection", { "innerHTML": groupSection }, true);
        // MyDom.showContent('#headerContent .tab[data-tab-name="groups"]');

        // // Load the users
        // await onGetListOfUsers();
        // var userSection = await MyTemplates.getTemplateAsync("templates/sections/user-section.html", {});
        // MyDom.setContent("#mainContentSection", { "innerHTML": userSection }, true);
        // MyDom.showContent('#headerContent .tab[data-tab-name="users"]');

        // // Load the users
        // await getListOfPaths();
        // var pathsSecction = await MyTemplates.getTemplateAsync("templates/sections/path-section.html", {});
        // MyDom.setContent("#mainContentSection", { "innerHTML": pathsSecction }, true);
        // MyDom.showContent('#headerContent .tab[data-tab-name="paths"]');



        // Load the tab from the URL
        loadTabFromUrl();

        // Load Access form
        var accessForm = await MyTemplates.getTemplateAsync("templates/forms/access-form.html", {});
        MyDom.setContent("#modalSection", {"innerHTML": accessForm}, true);

        var responseDetails = await MyTemplates.getTemplateAsync("templates/forms/response-details-form.html", {});
        MyDom.setContent("#modalSection", {"innerHTML": responseDetails}, true);

        // Always add a sync for users right after loading
        // MySyncManager.addSync("Users", onSyncUsers);
        
    } catch (err){
        MyLogger.LogError(err);
    } finally {
        MyDom.hideContent("#mainLoadingIcon");
    }
});

// Check search params & load specific tab
function loadTabFromUrl(){
    try{
        var tab = MyUrls.getSearchParam("tab");
        if(tab != undefined){
            var tabEle = document.querySelector(`.tab[data-tab-name="${tab}"]`);
            tabEle.click();
        }
    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.message);
    }
}

// Check search params & load specific content (called from other scripts)
async function loadContentFromURL(){
    try{
        var content = MyUrls.getSearchParam("content");
        if(content != undefined){
            var contentEle = document.querySelector(`.tab-section.active .entityOption[data-content-id="${content}"]`);
            if(contentEle != undefined){
                contentEle.click();
            } else {
                MyUrls.modifySearch({"content":""});
            }
        }
    } catch(err) {
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.message);
    }
}

// Set the current active tab
function onSetActiveTab(tabName){
    // Remove classes first
    MyDom.removeClass(".tab-section", "active");
    MyDom.removeClass(".cf-manage-tab", "active");

    // Add classes
    MyDom.addClass(`.tab-section[data-tab-name="${tabName}"]`, 'active');
    MyDom.addClass(`.cf-manage-tab[data-tab-name="${tabName}"]`, 'active');

    // Adjust the URL
    MyUrls.modifySearch({"tab": tabName});
}

// Set the current selected entity option
function onSetSelectedEntity(contentID=""){
    // Remove all existing selected ones
    MyDom.removeClass(".entityOption", "selected");

    // Add it to the given content ID
    MyDom.addClass(`.tab-section.active .entityOption[data-content-id="${contentID}"]`, "selected");
}

// Toggle the visibility of a list
function onToggleList(){
    var icon = document.querySelector(".tab-section.active .listToggleIcon");
    var closed = "fa-circle-chevron-right";
    var open = "fa-circle-chevron-down";
    var list = document.querySelector(".tab-section.active .listOfContent");
    var search = document.querySelector(".tab-section.active .searchContainer") ?? list;
    if(icon.classList.contains(closed)){
        icon.classList.add(open);
        icon.classList.remove(closed);
        list.style.display = "block";
        search.style.display = "block";
    } else { 
        icon.classList.add(closed);
        icon.classList.remove(open);
        list.style.display = "none";
        search.style.display = "none";
    }
}