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

    getType(){ return "Adventure" }
    getID(){ return this.AdventureID; }
    getName() { return this.Name; }

    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Type:"select", Label: "Status", Name: "status", Value: this.Status, Options: ["Active", "Draft", "Inactive"], Required: true} ),
            new FormField({ Label: "Name", Name: "name", Value: this.Name, Required: true} ),
            new FormField({ Label: "Date", Name: "date", Value: this.Date, Required: true} ),
            new FormField({ Type:"textarea", Label: "Description", Name: "description", Value: this.Description, Required: true} ),
            new FormField({ Label: "Thumbnail", Name: "thumbnail", Value: this.Thumbnail, Required: true} ),
            new FormField({ Label: "Access Type", Name: "accessType", Value: this.AccessType, Required: true} ),
            new FormField({ Label: "Access Group", Name: "accessGroup", Value: this.AccessGroup, Required: true} )
        ]
    }
}

// The "Event" object
class Event {
    constructor(jsonDetails){
        this.Status = jsonDetails?.status ?? "";
        this.EventID = jsonDetails?.eventID ?? "";
        this.EventKey = jsonDetails?.eventKey ?? "";
        this.Name = jsonDetails?.name ?? "";
        this.AccessType = jsonDetails?.accessType ?? "";
        this.AccessGroup = jsonDetails?.accessGroup ?? "";
        this.Template = jsonDetails?.template ?? "";
    }

    getType(){ return "Event" }
    getID(){ return this.EventID; }
    getName() { return this.Name; }

    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Label: "Status", Name: "status", Value: this.Status, Required: true} ),
            new FormField({ Label: "Name", Name: "name", Value: this.Name, Required: true } ),
            new FormField({ Label: "Event Key", Name: "eventKey", Value: this.EventKey, Required: true } ),
            new FormField({ Label: "Access Type", Name: "accessType", Value: this.AccessType, Required: true } ),
            new FormField({ Label: "Access Group", Name: "accessGroup", Value: this.AccessGroup, Required: true } ),
        ]
    }
}

// The response to an event
class EventResponse {
    constructor(details){
        this.ResponseKey = details?.responseKey ?? "";
        this.User = details?.user ?? "";
        this.ResponseDate = new Date(details?.responseDate)
        this.Comments = details?.comments ?? "";
        this.Answers = details?.answers?.join("<br/>") ?? [];
    }

    getType(){ return "Response" }
    getID(){ return this.ResponseKey; }
    getName() { return this.User; }

    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Label: "Date", Name: "date", Value: this.ResponseDate?.toLocaleDateString(), Required: true} ),
            new FormField({ Label: "User", Name: "user", Value: this.User, Required: true} ),
            new FormField({ Label: "Answers", Name: "answers", Value: this.Answers, Required: true} ),
            new FormField({ Label: "Comments", Name: "comments", Value: this.Comments, Required: true} )
        ]
    }
}


// The "Group" object
class Group {
    constructor(detailsJson={}){
        this.Key = detailsJson?.key ?? "";
        this.Value = detailsJson?.value ?? "";
    }

    getType(){ return "Group" }
    getID(){ return this.Key; }
    getName() { return this.Value; }

    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Label: "Name", Name: "value", Value: this.Value, Required: true} ),
            new FormField({ Label: "Key", Name: "key", Value: this.Key, Required: true} )
        ]
    }
}

// A way to manage list of things on the page
class PageManager { 

    constructor(){
        this.Content = {};
    }

    // CHeck if content mapped
    hasContentKey(key){ return Object.keys(this.Content).includes(key); }
    
    // Get existing content
    getContentDetailsByKey(key){ return this.Content[key] ?? []; }
    
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

    // Clear existing content
    removeContent(key){
        if(this.hasContentKey(key)){
            delete this.Content[key];
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

// The "Path" object
class Path {
    constructor(jsonObj={}){
        this.Key = jsonObj?.key ?? "";
        this.Value = jsonObj?.value ?? "";
        this.Path = jsonObj?.path ?? "";
        this.Date = new Date(jsonObj?.date);
        this.Domain = jsonObj?.domain ?? "";
    }

    getType(){ return "Path" }
    getID(){ return this.Key; }
    getName() { return this.Key; }

    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Label: "Code", Name: "key", Value: this.Key, Required: true} ),
            new FormField({ Label: "Path", Name: "value", Value: decodeURIComponent(this.Value), Required: true, EncodeOnSave: true} ),
            new FormField({ Label: "Domain", Name: "domain", Value: decodeURIComponent(this.Domain), Required: true, EncodeOnSave: true} )
        ]
    }
}


// Response details (for popup)
class ResponseDetails {
    constructor(label, text){
        this.ResponseLabel = label;
        this.ResponseText = text;
        this.adjustLabel();
    }
    adjustLabel(){
        switch(this.ResponseLabel){
            case "65189b72a84f0a7fbaeba9cd":
                this.ResponseLabel = "gala30";
                break;
            case "65189d14f4387ce1ae886ded":
                this.ResponseLabel = "boatRide30";
                break;
            case "65212aa3905211ae4c8a3328":
                this.ResponseLabel = "beachParty30";
                break;
            case "651caf20afa24983b0315d32":
                this.ResponseLabel = "";
                break;
            default:
                this.ResponseLabel = this.ResponseLabel;
        }

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

// The "Site" object
class Site {
    constructor(jsonObj={}){
        this.Key = jsonObj?.key ?? "";
        this.Value = jsonObj?.value ?? "";
        this.Date = new Date(jsonObj?.date);
        this.Site = decodeURIComponent(this.Value)
    }

    getType(){ return "Site" }
    getID(){ return this.Key; }
    getName() { return this.Key; }

    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Label: "Name", Name: "key", Value: this.Key, Required: true} ),
            new FormField({ Label: "Value", Name: "value", Value: decodeURIComponent(this.Value), Required: true, EncodeOnSave:true} ),
            new FormField({ Type: "link", Label: "Open", Name: "key", Value: this.Site, Required: true, ExcludeOnSave: true } )
        ]
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

// The "User" object
class User { 
    constructor(userDetails) {
        this.FirstName = userDetails?.FirstName ?? "";
        this.LastName = userDetails?.LastName ?? "";
        this.EmailAddress = userDetails?.EmailAddress ?? "";
        this.PhoneNumber = userDetails?.PhoneNumber ?? "";
        this.UserKey = userDetails?.key ?? userDetails?.Key ?? "";
        this.Updated = userDetails.updated ?? userDetails?.Updated ?? "";
        // Adding a recent message
        this.UpdatedStatus = this.getUpdatedStatus();
    }

    getType(){ return "User" }
    getID(){ return this.UserKey; }
    getName() { return `${this.FirstName} ${this.LastName}`; }


    // Get the fields list for this object
    getFields(){
        return [ 
            new FormField({ Type: "info", Label: "User", Name: "key", Value: `${this.FirstName} ${this.LastName}`, Required: true, ExcludeOnSave: true} )
        ]
    }

    getUpdatedStatus(){
        var results = ["added"]; 
        var age = 0;
        try { 
            var updatedDate = new Date(this.Updated);
            var todayDate = new Date()
            age = Math.floor((todayDate.getTime() - updatedDate.getTime()) / (24*3600*1000)); 

            var ranges = [1,3,7,14,30,60,90]
            let rangeGotSet = false;
            for(let range of ranges)
            {
                var compareDate = new Date();
                compareDate.setDate( compareDate.getDate() - range);
                if(updatedDate >= compareDate){
                    results.push(range);
                    rangeGotSet = true;
                    break;
                }
            }
            
            // If no other range set, just say it's old
            if(!rangeGotSet){
                results.push("old")
            }

            // Add the age at the end
            results.push(`(${age})`)

        } catch (err){
            MyLogger.LogError(err);

        } finally {
            var combo = results.join(":")
            return combo

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