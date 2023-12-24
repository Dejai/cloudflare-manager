// A way to manage list of things on the page
class PageManager { 

    constructor(){
        this.Content = {};
        this.ToBeSynced = new Set(["users"]); // always start with users
    }

    // CHeck if content mapped
    hasContentKey(key){ return Object.keys(this.Content).includes(key); }
    // Get existing content
    getContent(key){ return this.Content[key] ?? []; }
    // Adding content
    addContent(key, content){
        if(!this.hasContentKey(key) ){
            this.Content[key] = [];
        }
        if(Array.isArray(content)){
            this.Content[key] = this.Content[key].concat(content);
        } else {
            this.Content[key] = content;
        }
    }

    // Keep track of things to be synced
    addToBySynced(val){ this.ToBeSynced.add(val); }
    async onSync() {
        try {
            for(var val of this.ToBeSynced){
                MyPageManager.infoMessage(`Syncing ${val}`, 2);
                var results = await MyFetch.call("GET", `https://syncer.dejaithekid.com/${val}`);
                this.setResultsMessage(results);
            }
            // After sync, reload the page
            MyUrls.refreshPage();
        } catch(err) {
            MyLogger.LogError(err);
            MyPageManager.errorMessage("Error: " + err.message, 10);
        }
    }

    // Notifications
    setNotifyMessage(content="", clearAfter=3){
        MyDom.setContent("#messageSection", {"innerHTML": content});
        MyDom.addClass("#messageSection", "active");
        var clearAfterMs = clearAfter*1000;
        setTimeout( ()=>{
            MyDom.removeClass("#messageSection", "active");
        }, clearAfterMs);
    }

    successMessage(message, clearAfter=3){
        var styledMessage = `<span style="color:limegreen;">${message}</span>`;
        MyPageManager.setNotifyMessage(styledMessage,5);
    }

    errorMessage(message, clearAfter=5){
        var styledMessage = `<span style="color:red;">${message}</span>`;
        MyPageManager.setNotifyMessage(styledMessage,5);
    }

    infoMessage(message, clearAfter=3){
        MyPageManager.setNotifyMessage(message,5);
    }

    // Set a notify message based on resuts
    setResultsMessage(results){
        var message = results?.message ?? "";
        var type = results?.type ?? "Content";
        if( message == "OK" ) {
            this.successMessage(`${type} saved!`);
        } else {
            var errMessage = `Could not save ${type}; ${message}`;
            this.errorMessage(errMessage, 10);
        }
    }
    
}

// The "Adventure" object
class Adventure {
    constructor(detailsJson={}) {
        this.AdventureID = detailsJson?.adventureID ?? "";
        this.Status = detailsJson?.status ?? "Draft";
        this.Name = detailsJson?.name ?? "";
        this.Date = detailsJson?.date ?? "";
        this.Description = detailsJson?.description ?? "";
        this.Thumbnail = detailsJson?.thumbnail ?? "";
        this.AccessType = detailsJson?.accessType ?? "";
        this.AccessGroup = detailsJson?.accessGroup ?? "";
        // this.Labels = JSON.stringify(detailsJson?.labels ?? []);
    }

    // Update this adventure with fields from the form
    update(fields){
        for(var key of Object.keys(fields)) {
			var pascalKey = key.substring(0,1).toUpperCase() + key.substring(1);
            if (this.hasOwnProperty(pascalKey)){
                this[pascalKey] = fields[key];
            }
        }
    }
}

// The "Group" object
class Group {
    constructor(detailsJson={}){
        this.Key = detailsJson?.key ?? "";
        this.Name = detailsJson?.name ?? "";
    }
}

// The "User" object
class User { 
    constructor(userDetails) {
        this.FirstName = userDetails?.FirstName ?? "";
        this.LastName = userDetails?.LastName ?? "";
        this.EmailAddress = userDetails?.EmailAddress ?? "";
        this.PhoneNumber = userDetails?.PhoneNumber ?? "";
        this.UserKey = userDetails?.Key ?? "";
        this.Updated = userDetails?.Updated ?? "";
        this.UpdatedDateTime = (new Date(this.Updated))?.toLocaleString();
    }
}

// The Access object
class UserAccess { 
    constructor(accessDetails){
        this.Access = accessDetails ?? {};
    }
    getAccessList(){
        var accessList = [];
        for(var key of Object.keys(this.Access)){
            var val = this.Access[key];
            accessList.push( {"Scope": key, "Group": val});
        }
        return accessList;
    }
}

// Class to store the video details
class StreamVideo {
    constructor(videoObj) {
        this.AdventureID = videoObj?.adventureID ?? "";
        this.AdventureID = (this.AdventureID == "") ? "0" : this.AdventureID;
        this.Adventure = this.AdventureID;
        this.AdventureName = "";
        this.ContentID = videoObj?.uid ?? "";
        this.ContentType = "stream";
        this.Creator = videoObj?.creator ?? "";
        this.ShowCreator = videoObj?.showCreator ?? "No";
        this.Date = videoObj?.date ?? "";
        this.Name = videoObj?.name ?? "";
        this.Description = videoObj?.description ?? "";
        this.Duration = videoObj?.duration ?? 0;
        this.Order = videoObj?.order ?? 0;
        this.Ready = videoObj?.readyToStream ?? false;
        this.Signed = videoObj?.requireSignedURLs ?? false;
        this.Preview = videoObj?.preview ?? "0m0s";
        this.Urls = videoObj?.urls ?? {};

        this.ManageUrl = `https://dash.cloudflare.com/3b3d6028d2018ee017d0b7b1338431cf/stream/videos/${this.ContentID}`;
    }

    setAdventureName(adventureMap){
        this.AdventureName = adventureMap[this.AdventureID] ?? "Default";
    }

    setEditIcons(iconsHtml){
        this.EditIcons = iconsHtml;
    }
}