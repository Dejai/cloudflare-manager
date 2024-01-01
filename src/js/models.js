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
            this.Content[key] = undefined;
        }

        // If content is a list
        if(Array.isArray(this.Content[key])){
            if(Array.isArray(content)){
                this.Content[key] = this.Content[key].concat(content);
            } else {
                this.Content[key].push(content);
            }    
        } else {
            this.Content[key] = content;
        }
    }

    // Keep track of things to be synced
    addToBySynced(val){ this.ToBeSynced.add(val); }
    async onSync() {
        try {
            for(var val of this.ToBeSynced){
                this.infoMessage(`Syncing ${val}`, -1);
                var results = await MyCloudFlare.Files("GET", `/${val}/sync`);
                this.setResultsMessage(results);
            }
            // After sync, reload the page
            setTimeout(()=> {
                MyUrls.refreshPage();
            }, 3000);
            
        } catch(err) {
            MyLogger.LogError(err);
            this.errorMessage("Error: " + err.message, 10);
        }
    }

    // Notifications
    setNotifyMessage(content="", clearAfter=3) {
        MyDom.setContent("#messageSection", {"innerHTML": content});
        MyDom.addClass("#messageSection", "active");
        if(clearAfter > 0){
            var clearAfterMs = clearAfter*1000;
            setTimeout( ()=>{
                MyDom.removeClass("#messageSection", "active");
            }, clearAfterMs);
        }
    }

    successMessage(message, clearAfter=3){
        var styledMessage = `<span style="color:limegreen;">${message}</span>`;
        MyPageManager.setNotifyMessage(styledMessage,clearAfter);
    }

    errorMessage(message, clearAfter=5){
        var styledMessage = `<span style="color:red;">${message}</span>`;
        MyPageManager.setNotifyMessage(styledMessage,clearAfter);
    }

    infoMessage(message, clearAfter=3){
        MyPageManager.setNotifyMessage(message,clearAfter);
    }

    // Set a notify message based on resuts
    setResultsMessage(results){
        var message = results?.message ?? "OK";
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
        this.Value = detailsJson?.value ?? "";
    }
    
    update(fields){
        for(var key of Object.keys(fields)) {
			var pascalKey = key.substring(0,1).toUpperCase() + key.substring(1);
            if (this.hasOwnProperty(pascalKey)){
                this[pascalKey] = fields[key];
            }
        }
    }
}

// The "Path" object
class Path {
    constructor(jsonObj={}){
        this.Key = jsonObj?.key ?? "";
        this.Value = jsonObj?.value ?? "";
        this.Path = jsonObj?.path ?? "";
        this.Date = new Date(jsonObj?.date);
    }
    
    update(fields){
        for(var key of Object.keys(fields)) {
			var pascalKey = key.substring(0,1).toUpperCase() + key.substring(1);
            if (this.hasOwnProperty(pascalKey)){
                this[pascalKey] = fields[key];
            }
        }
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
        // Adding a recent message
        this.UpdatedStatus = (this.isRecentlyAdded()) ? "new" : "";
    }

    isRecentlyAdded(){
        var results = false; 
        try { 
            var updatedDate = new Date(this.Updated);
            var yesterday = new Date();
            yesterday.setDate( yesterday.getDate() - 2);
            results = (updatedDate > yesterday);
        } catch (err){
            MyLogger.LogError(err);
        } finally {
            return results;
        }
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

// Used to keep track of something being "Saved"
class SaveStatus{
    constructor(element){
        this.InitialText = element?.innerText ?? "Default";
        this.Element = element;
        this.Spinner = `<i class="fa-solid fa-spinner dtk-spinning dtk-spinning-1500" style="font-size:120%;"></i>`
    }
    saving(){
        this.info( "SAVING " + this.Spinner)
        this.Element.disabled = true;
    }
    info(message, clearAfter=0){
        this.Element.classList.add("saveInfo");
        this.Element.innerHTML = message;
        if(clearAfter > 0){
            this.reset(clearAfter);
        }
    }
    error(message, clearAfter=3){
        this.Element.classList.add("saveError");
        this.Element.innerHTML = "ERROR: " + message; 
        this.reset(clearAfter);
    }
    success(message="", clearAfter=2){
        this.Element.classList.add("saveSuccess");
        this.Element.innerHTML = "SUCCESS: " + message.toUpperCase(); 
        this.reset(clearAfter);
    }
    results(results, type="Content"){
        var message = results?.message ?? "OK";
        if( message == "OK" ) {
            this.success(`${type} saved!`);
        } else {
            var errMessage = `Could not save ${type.toLowerCase()}; ${message}`;
            this.error(errMessage);
        }
    }
    reset(clearAfter=3){
        var time = 1000 * clearAfter;
        setTimeout( ()=> {
            this.Element.classList.remove("saveInfo");
            this.Element.classList.remove("saveError");
            this.Element.classList.remove("saveSuccess");
            this.Element.disabled = false;
            this.Element.innerHTML = this.InitialText;
        },time);
    }
}