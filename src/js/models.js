// Used to keep track of things on the page
class FileManagerPage {
    constructor() {
        this.TrelloCards = [];
        this.TrelloMap = {};
        this.Adventures = [];
        this.StreamVideos = [];
        // Keeping track of what we are filtered by
        this.FilteredByAdventure = "";
        this.IsFiltered = false;
    }

    // Return if page is filtered by an adventure
    isFiltered(){
        return this.FilteredByAdventure != "";
    }

    // Set the list of adventures available to this page
    setAdventures(cards){
        this.TrelloCards = cards;
        for(var card of this.TrelloCards) {
            this.TrelloMap[card.AdventureID] = card.Name;
            this.TrelloMap[card.Name] = card.AdventureID;
        }
        this.TrelloCards.sort( (a,b) => {
            return (a.Name < b.Name) ? -1 : (a.Name > b.Name) ? 1 : 0;
        });
        this.setAdventureLists();
    }

    // Set the list of stream videos
    setStreamVideos(videos){
        for(var video of videos){ 
            video.setAdventureName(this.TrelloMap);
            this.StreamVideos.push(video);
        }
    }

    // Set the list of adventures in key parts of the page
    setAdventureLists(){
        var options = this.TrelloCards.map(card => card.toOptionHtml(this.AdventureID))?.join("");
        MyDom.setContent("#listOfAdventures", {"innerHTML": options});
        MyDom.setContent("select#bulkAdventure", {"innerHTML": options});
        var dropdowns = this.TrelloCards.map(card => card.toDropdownRow())?.join("");
        MyDom.setContent("#adventureFilterDropdown", {"innerHTML": dropdowns}, true);
    }

    // Search content based on name & description
    searchContent(filter) {
        var filterUpper = filter.toUpperCase();
        var content = (this.isFiltered()) ? this.StreamVideos.filter(x => x.AdventureID == this.FilteredByAdventure) : this.StreamVideos;
        var matchingContentIds = content.filter(
                                        x => x.Name.toUpperCase().includes(filterUpper) 
                                        || x.AdventureName.toUpperCase().includes(filterUpper) 
                                        || x.Creator.toUpperCase().includes(filterUpper) 
                                        || x.Date.toUpperCase().includes(filterUpper) 
                                    ).map(y => y.ContentID);
        return matchingContentIds;
    }

}

// A way to manage list of things on the page
class PageManager { 

    constructor(){
        this.Content = {};
        this.ToBeSynced = new Set();
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
                MyPageManager.setNotifyMessage(`Syncing ${val}`, 2);
                var results = await MyFetch.call("GET", `https://syncer.the-dancinglion.workers.dev//${val}`);
                this.setResultsMessage(results);
            }
    
        } catch(err) {
            MyLogger.LogError(err);
            MyPageManager.setNotifyMessage("Error: " + err.message, 10);
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
    // Set a notify message based on resuts
    setResultsMessage(results){
        console.log(results);
        var message = results?.message ?? "";
        var type = results?.type ?? "Content";

        if( message == "OK" ) {
            this.setNotifyMessage(`${type} saved!`);
        } else {
            var errMessage = `Could not save ${type}; ${message}`;
            this.setNotifyMessage(errMessage, 10);
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
        console.log(this);
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





// A trello card
class TrelloCard {
    constructor(trelloJson){
        this.AdventureID = trelloJson?.id ?? "";
        this.Name = trelloJson?.name ?? "";
    }

    toOptionHtml(adventureID=undefined){
        return `<option value="${this.Name}" data-adventure-id="${this.AdventureID}">${this.Name}</option>`;
    }

    toDropdownRow(){
        return `<p class="adventureFilter" data-adventure-id="${this.AdventureID}" onclick="onFilterByAdventureID(this.getAttribute('data-adventure-id'))">${this.Name}</p>`;
    }
}

// Class to store the video details
class StreamVideo
{
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

// Used to edit a single file row
class FileRow {
    constructor(fileRow){
        this.Row = fileRow;
        this.AdventureID = fileRow?.getAttribute("data-adventure-id");
        this.ContentID = fileRow?.getAttribute("data-content-id");
        this.Name = fileRow?.querySelector(".fieldToSave2[name='name']")?.value ?? "";
        this.AdventureName = fileRow?.querySelector(".fieldToSave2[name='adventure']")?.value ?? "";
        this.Creator = fileRow?.querySelector(".fieldToSave2[name='creator']")?.value ?? "";
        this.ShowCreator = fileRow?.querySelector(".fieldToSave2[name='showCreator']")?.value ?? "No";
        this.Date = fileRow?.querySelector(".fieldToSave2[name='date']")?.value ?? "";
        this.Description = fileRow?.querySelector(".fieldToSave2[name='description']")?.innerText ?? "";

    }

    // Validate that this adventure has the two key things needed
    validate(){
        if(this.Name == "") {
            return "A Name is required for the file"
        } 
        if (this.Creator == ""){
            return "A Creator is required for the file"
        }
        if (this.AdventureID == ""){
            return "An adventure must be selected"
        }
        return ""
    }

    // Convert this object to a JSON object
    toJson(){
        return {
            "adventure": this.AdventureID,
            "name": this.Name,
            "creator": this.Creator,
            "showCreator": this.ShowCreator,
            "date": this.Date,
            "description": this.Description
        }
    }
}