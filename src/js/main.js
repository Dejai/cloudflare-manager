
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
        for(var tab of tabs)
        {
            var tabName = tab.getAttribute("data-tab-name");
            var templateName = tabName.substring(0, tabName.length-1);
            var section = await MyTemplates.getTemplateAsync(`templates/sections/${templateName}-section.html`, {});
            MyDom.setContent("#mainContentSection", {"innerHTML": section }, true);
            MyDom.showContent(`#headerContent .tab[data-tab-name="${tabName}"]`);
        }

        // Getting the content (note: these are asynchronous calls, so will finish when they finish)
        onGetEvents();
        onGetUsers();
        onGetPaths();
        onGetGroups();
        onGetAdventures();

        // Load the tab from the URL

        // Load Access form
        var accessForm = await MyTemplates.getTemplateAsync("templates/forms/access-form.html", {});
        MyDom.setContent("#modalSection", {"innerHTML": accessForm}, true);

        var responseDetails = await MyTemplates.getTemplateAsync("templates/forms/response-details-form.html", {});
        MyDom.setContent("#modalSection", {"innerHTML": responseDetails}, true);
        
    } catch (err){
        MyLogger.LogError(err);
    } 
});
