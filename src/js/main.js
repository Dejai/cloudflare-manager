
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyCloudFlare = new CloudflareWrapper();
const MyEntityManager = new EntityManager();

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
            MyDom.hideContent("#mainLoadingIcon");
            throw new Error("Login required");
        }

        // Check if manager
        var manager = await MyCloudFlare.Files("GET", "/manager");
        if(!(manager?.results ?? false)){
            MyDom.showContent("#unauthorized");
            throw new Error("Unauthorized");
        }

        // Get the entities app JSON and map to object
        let entities = await fetch("./config/app.json").then( (x) => x.json() ).then( (y) => y.map( obj => new CloudflareEntity(obj)))

        // Setting tabs
        let mainLoadingIcon = document.getElementById("mainLoadingIcon");
        for(let entity of entities ) {
            await entity.fetchContent();
            let tab = entity.getTabButton();
            mainLoadingIcon.parentElement.insertBefore(tab, mainLoadingIcon);
        }
        MyDom.hideContent("#mainLoadingIcon");
        onLoadFromURL();      
    } catch (err){
        MyLogger.LogError(err);
    } 
});

// Close the content section
function onCloseContent(){
    MyDom.hideContent(".hideOnContentSave");
    MyDom.showContent(".showOnTabSelected");
    MyDom.setContent(".clearOnCloseForm", {"innerHTML": ""})
    MyUrls.modifySearch({"content":"", "sub": ""})
    MyUtils.Cookies.deleteContent();
}

// Load from URL
async function onLoadFromURL(){
    try{
        // First, click tab
        var tab = MyUtils.Cookies.getTab() ?? ""
        let tabButton = document.querySelector(`.headerTab[data-tab-name="${tab}"]`)
        if(tabButton != undefined){
            tabButton.click();
        }

        // Second, click content
        var content = MyUtils.Cookies.getContent() ?? "";
        let contentItem = document.querySelector(`[data-content-id="${content}"]`)
        if(contentItem != undefined){
            contentItem.click();
        }
    } catch(err){
        MyLogger.LogError(err);
    }
}