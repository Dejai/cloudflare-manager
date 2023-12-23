
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyFileManagerPage = new FileManagerPage();
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

        // Show things after loading
        MyDom.hideContent(".hideOnInitialLoad");
        MyDom.showContent(".showOnInitialLoad");

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

    // Get old stuff & convert to new stuff
    // var cards = await MyTrello.GetCardsByListName("Adventures");
    // for(var c of cards){
    //     var d = c["start"]?.split("T")?.[0];
    //     var n = c["name"]; 
    //     console.log(n + " : " + d);
    // }
});

/******** GETTING STARTED: Loading the Adventures & Labels; Check if logged in user***************************/

// Set notify message
function setNotifyMessage(content="", clearAfter=5){
    MyDom.setContent("#messageSection", {"innerHTML": content});
    MyDom.addClass("#messageSection", "active");
    var clearAfterMs = clearAfter*1000;
    setTimeout( ()=>{
        MyDom.removeClass("#messageSection", "active");
    }, clearAfterMs);
}