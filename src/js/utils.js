
// Get the prefix on a date value
function dateValueFormat(val){
    return (val < 10) ? "0"+val : ""+val;
}

// Count unique matches of elements based on selector
function getNumberOfMatches(selector){
    try { 
        return document.querySelectorAll(selector)?.length
    } catch(ex){
        console.error(ex);
        return 0;
    }
}

// Get an object as JSON, with key in the given case
function getAsJson(theObject, keyCase="camel"){
    let json = {}
    for(let pair of Object.entries(theObject))
    {
        let key = pair[0]
        let val = pair[1]
        let jsonKey = (keyCase == "camel") ? key.substring(0,1).toLowerCase() + key.substring(1) : key;
        json[jsonKey] = val
    }
    return json
}

// Merge fields from an object into a string
function mergeFields(value, object=undefined){
    let results = value

    if(object == undefined){
        return results;
    }

    for(let pair of Object.entries(object)){
        let key = pair[0] ?? "";
        let val = pair[1] ?? "";
        results = results.replaceAll(`{${key}}`, val)
    }
    return results
}

// Format a date in a way that I want;
Object.defineProperty(Date.prototype, "ToDateFormat", {
    value: function ToDateFormat(format) {
        let yyyy = dateValueFormat(this.getFullYear());
        let dd = dateValueFormat(this.getDate());
        let MM = dateValueFormat(this.getMonth()+1);
        let hh = dateValueFormat(this.getHours());
        let mm = dateValueFormat(this.getMinutes());
        let ss = dateValueFormat(this.getSeconds());
        var tt = hh < 12 ? "AM" : "PM";

        // Return formatted format
        format = format
                    .replaceAll("yyyy",yyyy)
                    .replaceAll("dd",dd)
                    .replaceAll("MM",MM)
                    .replaceAll("hh",hh)
                    .replaceAll("mm",mm)
                    .replaceAll("ss",ss)
                    .replaceAll("tt",tt)
        return format;
    },
    writable: true,
    configurable: true
});


// Convert a string to a mapped HTML object
Object.defineProperty(String.prototype, "ToHtml", {
    value: function (tag, attributes="") {
        switch(tag){
            case "p":
                return `<p>${this}</p>`;
            case "tr":
                return `<tr ${attributes}>${this}</tr>`;
            case "th":
                return `<th>${this}</th>`;
            case "td":
                return `<td>${this}</td>`;
            default:
                return this;
        }
    }
})


// Add a way to convert an object to JSON String
Object.defineProperty(Object.prototype, "ToJsonString", {
    value: function(keyCase="pascal") {
        let json = {}
        try { 
            for(let pair of Object.entries(this))
            {
                let key = pair[0]?.replaceAll(" ", "")
                let val = pair[1]
                let jsonKey = (keyCase == "camel") ? key.substring(0,1).toLowerCase() + key.substring(1) : key;
                json[jsonKey] = val
            }
        } catch(ex){
            console.error(ex);
        } finally {
            return JSON.stringify(json);
        }
    }
})





// Check search params & load specific tab
function loadTabFromUrl(tabToLoad=""){
    try{
        var tab = MyUrls.getSearchParam("tab") ?? "n/a";
        if(tab == tabToLoad){
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
    MyDom.hideContent(".hideOnTabSwitch");

    // Remove classes first
    MyDom.removeClass(".tab-section", "active");
    MyDom.removeClass(".cfmTab", "active");
    MyDom.removeClass(".entityOption", "selected");

    // Add classes
    MyDom.addClass(`.tab-section[data-tab-name="${tabName}"]`, 'active');
    MyDom.addClass(`.cfmTab[data-tab-name="${tabName}"]`, 'active');

    // Clear all searches
    document.querySelectorAll(".searchClearIcon")?.forEach( (icon) => icon.click() );
    
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

// Doing the sync functionality
async function onSyncEntity(entityType, syncPath="")
{
    try {
        MyLogger.LogInfo("Syncing new way: " + entityType);
        var entityTypeLower = entityType.toLowerCase();

        // Show state of syncing
        MyDom.showContent(`.showOn${entityType}Syncing`);
        var statusSelector = `#${entityTypeLower}TabSection .objectSyncMessage .status`
        MyDom.setContent(statusSelector, {"innerText": "Syncing"});

        // Get sync status from Cloudflare
        syncPath = (syncPath != "") ? syncPath : `/${entityTypeLower}/sync`;
        var sync = await MyCloudFlare.Files("GET", syncPath);

        // Show sync date
        var syncDate = (new Date(sync?.lastSync)).ToDateFormat("yyyy-MM-dd at hh:mm:ss tt");
        var lastSyncMessage = `Last synced: <span style="margin-left:0.5%"><em>${syncDate}</em></span>`;
        MyDom.setContent(statusSelector, {"innerHTML": lastSyncMessage } );

        // Hide sync content
        MyDom.hideContent(`.hideOn${entityType}Synced`);

    } catch (err){
        MyLogger.LogError(err);
    } finally {
        return;
    }
}