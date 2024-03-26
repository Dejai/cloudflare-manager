
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
        let tabs = "";
        for(let entity of entities ) {
            await entity.fetchContent();
            MyEntityManager.mapEntity(entity.Name, entity)
            tabs += await entity.getTabHtml();
        }
        MyDom.hideContent("#mainLoadingIcon");
        MyDom.setContent("#manageTabs", { "innerHTML": tabs } )
        onLoadFromURL()        
    } catch (err){
        MyLogger.LogError(err);
    } 
});


// Clicking a tab
async function onClickTab(tab, keepContent=false){
    try { 
        MyDom.hideContent(".hideOnTabSwitch")

        // Get the tab name + entity
        let tabName = tab.getAttribute("data-tab-name")
        let entity = MyEntityManager.getEntityByKey(tabName)

        // Set the active tab colr
        MyDom.removeClass(".headerTab.cfmTab", "selected")
        MyDom.addClass(`.headerTab.cfmTab[data-tab-name='${tabName}']`, "selected")
        
        // Load the list of content
        let template = await entity.getContentListHtml()
        MyDom.setContent("#listOfContent", { "innerHTML": template })
        MyDom.setContent("#entityName", { "innerHTML": entity.Name })
        let _canAddNew = (entity.CanAddNew) ? MyDom.showContent("#canAddNewContent") : MyDom.hideContent("#canAddNewContent")

        let searchObj = { "tab": tabName }
        if(!keepContent){
            searchObj["content"] = ""
        }

        // Add the search bar
        MySearcher.addSearchBar(entity.Name, "#listOfContent", "#searchBarContainer");

        
        MyUrls.modifySearch(searchObj);
        MyDom.showContent(".showOnTabSelected")
    } catch(ex){
        console.error(ex)
    }
}

// Clicking a subtab (similar fetching, but don't clear tab info)
async function onClickSubTab(tab){
    try { 
        let tabName = tab.getAttribute("data-tab-name")
        
        // Set the active tab colr
        MyDom.removeClass(".childTab.cfmTab", "selected")
        MyDom.addClass(`.childTab.cfmTab[data-tab-name='${tabName}']`, "selected")

        // Get the tab name + entity
        let entity = MyEntityManager.getEntity();
        let childEntity = entity.getMatchingChildEntity(tabName);
        await childEntity.fetchContent();
        
        // Load the list of content
        let template = await childEntity.getContentListHtml()
        MyDom.setContent("#subTabContent", { "innerHTML": template })
        let _canAddNew = (childEntity.CanAddNew) ? MyDom.showContent("#canAddNewSubContent") : MyDom.hideContent("#canAddNewSubContent")
        MyUrls.modifySearch( {"sub": tabName } );

        // Add the search bar
        MySearcher.addSearchBar(childEntity.Name, "#subTabContent", "#subListSearch");
        
        // Add a counter based on keydown in the input
        const tableRowCounter = () => {
            let count = getNumberOfMatches("#subTabContent tbody tr:not(.searchableHidden)")
            MyDom.setContent("#subContentCounter", { "innerHTML": count} )
        }
        document.querySelector("#subListSearch .searchBarInput")?.addEventListener("keyup", tableRowCounter);
        document.querySelector("#subListSearch .searchClearIcon")?.addEventListener("click", tableRowCounter);
        tableRowCounter();

        MyDom.showContent(".showOnSubTabClick")

    } catch(ex){
        console.error(ex)
    }
}

// Select the content from the list
async function onSelectContent(item){
    try { 
        let entity = MyEntityManager.getEntity() 
        let contentID = item.getAttribute("data-content-id")
        let content = entity?.getMatchingContent(contentID);
        if(content != undefined){
            await loadContentSection("Edit", content)

            MyDom.hideContent(".hideOnSelectContent");
        }
    } catch (ex){
        console.error(ex)
    }
}

// Load the selected/new content in the form
async function loadContentSection(action, content){
    let entity = MyEntityManager.getEntity();
    entity.setCurrentContent(content);
    let contJson = content.getContentJson()

    MyDom.hideContent(".hideOnContentSelect");
    MyDom.setContent("#formHeader", { "innerHTML": `${action} ${contJson.ContentType}`})

    let template = await MyTemplates.getTemplateAsync("/templates2/formRow.html", content.getFields() );
    MyDom.setContent("#displayFormSection", { "innerHTML": template }) 

    if(entity.Children.length > 0){
        let subTabs = await entity.getChildTabsHtml();
        MyDom.showContent(".showIfSubTabs");
        MyDom.setContent("#subTabsList", {"innerHTML": subTabs})
    }

    MyDom.showContent(".showOnContentSelect")
    MyUrls.modifySearch({"content":contJson.ContentID})
}

// Adding a new entity
function onAddContent(){
    try { 
        let entity = MyEntityManager.getEntity();
        let newContent = entity.createNewContent();
        loadContentSection("Add", newContent);
    } catch(ex){
        console.error(ex)
    }
}

async function onSaveContent(button){s

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    // Get form details
    var formDetails = MyDom.getFormDetails("#displayFormSection");
    var fields = formDetails?.fields;
    var errors = formDetails?.errors;
    if(errors.length > 0){
        var errorMessage = errors.join(" ; ");
        saveStatus.error(errorMessage);
        return;
    }

    // Get/update existing group or add a new one.
    let content = MyEntityManager.getContentJson()
    let entity = MyEntityManager.getEntity()
    await entity.saveContent(content, fields)

    let template = await entity.getContentListHtml()
    MyDom.setContent("#listOfContent", { "innerHTML": template })

    onCloseContent();
}

function onCancelContent(){
    onCloseContent();
}

function onCloseContent(){
    let entity = MyEntityManager.getEntity();
    entity.setCurrentContent(undefined);
    MyDom.hideContent(".hideOnContentSave");
    MyDom.showContent(".showOnTabSelected");
    MyDom.setContent("#subTabContent", {"innerHTML": ""})
    MyDom.setContent("#subListSearch", {"innerHTML": ""})
    MyUrls.modifySearch({"content":"", "sub": ""})
}

// Load from URL
async function onLoadFromURL(){
    try{


        // First, click tab
        var tab = MyUrls.getSearchParam("tab") ?? "";
        let tabButton = document.querySelector(`.headerTab[data-tab-name="${tab}"]`)
        if(tabButton != undefined){
            await onClickTab(tabButton, true);
        }

        // Second, click content
        var content = MyUrls.getSearchParam("content") ?? "";
        let contentItem = document.querySelector(`[data-content-id="${content}"]`)
        if(contentItem != undefined){
            await onSelectContent(contentItem);
        }

        // Third, click subtab
        var subTab = MyUrls.getSearchParam("sub") ?? "";
        let subTabButton = document.querySelector(`.childTab[data-tab-name="${subTab}"]`)
        if(contentItem != undefined && subTabButton != undefined){
            onClickSubTab(subTabButton);
        }
    } catch(err){
        MyLogger.LogError(err);
    }
}