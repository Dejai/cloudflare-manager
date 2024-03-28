const MyUtils = {
    Cookies: {
        setTab(tab){ MyCookies.setCookie( MyCookies.getCookieName("CFM-TAB"), tab); },
        getTab(){ return MyCookies.getCookie(MyCookies.getCookieName("CFM-TAB")) },
        deleteTab(){ MyCookies.deleteCookie(MyCookies.getCookieName("CFM-TAB")) },

        setContent(content){ MyCookies.setCookie( MyCookies.getCookieName("CFM-CONTENT"), content); },
        getContent(){ return MyCookies.getCookie(MyCookies.getCookieName("CFM-CONTENT")) },
        deleteContent(){ MyCookies.deleteCookie(MyCookies.getCookieName("CFM-CONTENT")) }
    }
}


// Get the prefix on a date value
function doubleDigitize(val){
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

        // Base values
        var currDate = this;
        var year = currDate.getFullYear()?.toString();
        var monthNum = currDate.getMonth()+1;
        var month = (monthNum < 10) ? "0"+monthNum : ""+monthNum;
        var monthNameLong = currDate.toLocaleString('default', { month: 'long' });
        var monthNameShort = currDate.toLocaleString('default', { month: 'short' });
        var dayNum = currDate.getDate();
        var day = (dayNum < 10) ? "0"+dayNum : ""+dayNum;
        var hoursNum = currDate.getHours()
        var hour = doubleDigitize(hoursNum);
        var hour12 = doubleDigitize(hoursNum == 12 ? 12 : hoursNum % 12);
        var minute = doubleDigitize(currDate.getMinutes());
        var seconds = doubleDigitize(currDate.getSeconds());
        var AmPm = hoursNum >= 12 ? "PM" : "AM"

        // The date parts formatted
        var formattedDate = format;
        formattedDate = formattedDate.replace("yyyy", year);
        formattedDate = formattedDate.replace("MMMM", monthNameLong);
        formattedDate = formattedDate.replace("MMM", monthNameShort);
        formattedDate = formattedDate.replace("MM", month);
        formattedDate = formattedDate.replace("dd", day);
        formattedDate = formattedDate.replace("hh", hour12);
        formattedDate = formattedDate.replace("HH", hour);
        formattedDate = formattedDate.replace("mm", minute);
        formattedDate = formattedDate.replace("ss", seconds);
        formattedDate = formattedDate.replace("tt", AmPm);

        return formattedDate;

        // let yyyy = doubleDigitize(this.getFullYear());
        // let dd = doubleDigitize(this.getDate());
        // let MM = doubleDigitize(this.getMonth()+1);
        // let hh = doubleDigitize(this.getHours());
        // let mm = doubleDigitize(this.getMinutes());
        // let ss = doubleDigitize(this.getSeconds());
        // var tt = hh < 12 ? "AM" : "PM";

        // // Return formatted format
        // format = format
        //             .replaceAll("yyyy",yyyy)
        //             .replaceAll("dd",dd)
        //             .replaceAll("MM",MM)
        //             .replaceAll("hh",hh)
        //             .replaceAll("hh",hh)
        //             .replaceAll("mm",mm)
        //             .replaceAll("ss",ss)
        //             .replaceAll("tt",tt)
        // return format;
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

// Update fields in an object
Object.defineProperty(Object.prototype, "UpdateFields", {
    value: function(fields){
        for(var pairs of Object.entries(fields)) {
            let key = pairs[0] ??  "";
            let val = pairs[1] ?? "";
            if(val instanceof Date){
                continue
            }
			var pascalKey = key.substring(0,1).toUpperCase() + key.substring(1);
            if (this.hasOwnProperty(pascalKey)){
                this[pascalKey] = val;
            }
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
                json[jsonKey] = (val instanceof Date) ? val.ToDateFormat("yyyy-MM-ddTHH:mm:ssZ") : encodeURIComponent(val)
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