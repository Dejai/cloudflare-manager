
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyCloudFlare = new CloudflareWrapper();
const MyPageManager = new PageManager();

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

        // Load the adventures
        await getListOfAdventures();
        var adventureSection = await MyTemplates.getTemplateAsync("templates/sections/adventure-section.html", {});
        MyDom.setContent("#contentSection", {"innerHTML": adventureSection }, true);
        
        // Load the Groups
        await getListOfGroups();
        var groupSection = await MyTemplates.getTemplateAsync("templates/sections/group-section.html", {});
        MyDom.setContent("#contentSection", { "innerHTML": groupSection }, true);

        // Load the users
        await getListOfUsers();
        var userSection = await MyTemplates.getTemplateAsync("templates/sections/user-section.html", {});
        MyDom.setContent("#contentSection", { "innerHTML": userSection }, true);

        // Show something
        await showMainContent();
        
        // Load modals
        var adventureForm = await MyTemplates.getTemplateAsync("templates/forms/file-edit-form.html", {});
        var accessForm = await MyTemplates.getTemplateAsync("templates/forms/access-form.html", {});
        MyDom.setContent("#modalSection", {"innerHTML": adventureForm}, true);
        MyDom.setContent("#modalSection", {"innerHTML": accessForm}, true);

    } catch (err){
        MyLogger.LogError(err);
    }


    // First, get the set of adventures & store in select list
    // await GetListOfAdventures();

    // // Load up the modal for editing files
    // var fileEditModal = await MyTemplates.getTemplateAsync("templates/adventures/file-edit-modal.html", {});
    // MyDom.setContent("#fileEditModal", {"innerHTML": fileEditModal});

    // var existingAdventureID = MyUrls.getSearchParam("adventure");
    // if(existingAdventureID != undefined){
    //     loadAdventureByID(existingAdventureID);
    // }
});

// Show content based on results of loads
async function showMainContent(){
    var templateName = "";
    var isLoggedIn = await MyAuth.isLoggedIn();
    if(!isLoggedIn) {
        templateName = "loginRequired"
    } else {
        var advs = MyPageManager.getContent("Users")?.length ?? 0;
        var groups = MyPageManager.getContent("Users")?.length ?? 0;
        var users = MyPageManager.getContent("Users")?.length ?? 0;
        if(advs > 0 && groups > 0 && users > 0){
            templateName = "tabs"
        } else { 
            templateName = "unAuthorized"
        }
    }
    
    var template = await MyTemplates.getTemplateAsync(`./templates/_shared/${templateName}.html`, {});
    MyDom.setContent("#mainContent", {"innerHTML": template});

    // If loaded tabs, then check URL for existing tabs
    if(templateName == "tabs"){
        loadTabFromUrl();
    }
}

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
        MyPageManager.errorMessage(err.Message);
    }
}

// Check search params & load specific content (called from other scripts)
async function loadContentFromURL(){
    try{
        var content = MyUrls.getSearchParam("content");
        if(content != undefined){
            var contentEle = document.querySelector(`.tab-section.active .content-selector[data-content-id="${content}"]`);
            if(contentEle != undefined){
                contentEle.click();
            } else {
                MyUrls.modifySearch({"content":""});
            }
        }
    } catch(err) {
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message);
    }
}

// Set the current active tab
function onSetActiveTab(tabName){
    MyDom.removeClass(".tab-section", "active");
    MyDom.addClass(`.tab-section[data-tab-name="${tabName}"]`, 'active');
    MyUrls.modifySearch({"tab": tabName});
}