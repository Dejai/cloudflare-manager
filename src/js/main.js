
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

         // Wait on all section to be done before hiding loading
         new Promise( (resolve) => {
            setInterval( ()=>{
                if( Object.keys(MyPageManager.Content).length >= tabs.length) {
                    MyDom.hideContent("#mainLoadingIcon");
                    resolve(true);
                }
            }, 500);
        });

        // Load the modal templates
        const modalTemplates = {
            "Access Form": "templates/forms/access-form.html",
            "Response Details": "templates/forms/response-details-form.html",
            "File Details": "templates/forms/file-edit-form.html" };

        for(let path of Object.values(modalTemplates)) 
        {
            var template = await MyTemplates.getTemplateAsync(path, {});
            MyDom.setContent("#modalSection", {"innerHTML": template}, true);
        }
        
    } catch (err){
        MyLogger.LogError(err);
    } 
});
