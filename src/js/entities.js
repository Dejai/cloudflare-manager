class EntityManager {
    constructor(){
        this.EntityMap = {}
        this.Entity = undefined;
    }
    mapEntity(key, obj){ this.EntityMap[key] = obj }
    setEntity(key){ this.Entity = this.EntityMap[key] ?? undefined; }
    getEntity(key=undefined){ 
        // If given key, but not set entity, then try to set it
        if(key != undefined && this.Entity == undefined){ this.setEntity(key); }
        return this.Entity;
    }
}

// Mapping the JSON to models
const EntityMap = (name, content) => {
    try { 
        switch(name){
            case "Adventures":
                return new Adventure(details);
            case "Users":
                return new User(details);
            case "Groups":
                return new Group(details);
            case "Paths":
                return new Path(details);
            case "Events":
                return new Event(details);
            case "Responses":
                return new EventResponse(details);
            case "Sites":
                return new Site(details);
            default:
                console.error("Could not map this type of Entity: " + name);
                return []
        }
    } catch(ex){
        console.error(ex);
        return [];
    }
}

class Content { 

    constructor(entity, details) {
        this.Entity = entity;
        this.Object = this.setObject(entity, details);
        this.ContentID = this.Object?.getID() ?? "";
        this.ContentType = this.Object?.getType() ?? "";
        this.ContentName = this.Object?.getName() ?? "";
        this.ContentFields = this.Object?.getFields() ?? [];
    }

    // Selecting this content for management
    async onSelectContent (action='Edit'){

        // Set the save button
        this.setSaveButton();

        // Adjust visibility
        MyDom.hideContent(".hideOnContentSelect");
        MyDom.setContent("#formHeader", { "innerHTML": `${action} ${this.ContentType}`})
    
        let template = await MyTemplates.getTemplateAsync("/templates2/formRow.html", this.Object?.getFields() );
        MyDom.setContent("#displayFormSection", { "innerHTML": template }) 

        // Set any chldren tab if any
        this.Entity.getChildTabButtons(this);

        MyDom.showContent(".showOnContentSelect")
        MyUrls.modifySearch({"content": this.ContentID})
        MyUtils.Cookies.setContent(this.ContentID);
    }

    // Get this content to be displayed in HTML
    getContentHtml(format){
        try { 
            format = format.toLowerCase();
            switch(format){
                case "pills":
                    let pill = document.createElement("div");
                    pill.classList = "entityCard flex-row flex-justify-center flex-align-center flex-gap-10 border-round pointer searchable";
                    pill.innerHTML = `<span>${this.ContentName}</span> <i class="fa-solid fa-pen-to-square"></i>`;
                    pill.setAttribute("data-content-id", this.ContentID)
                    pill.addEventListener( "click", () => {
                        this.onSelectContent ();
                    });
                    return pill;
                case "table":
                    let thead = document.createElement("thead");
                    thead.innerHTML = this.ContentFields.filter(field => field.ShowInTable)?.map( field => field.Label )?.map( label => label.ToHtml("th") )?.join("")?.ToHtml("tr");
                    thead.classList = "align-left"

                    let tbody = document.createElement("tbody");
                    tbody.innerHTML = this.ContentFields.filter(field => field.ShowInTable)?.map( field => field.Value )?.map( value => (value.toString() ?? "").ToHtml("td") ?? "" )?.join("")?.ToHtml("tr", `class="searchable"`);
                    return { head: thead, body: tbody };
                default:
                    console.log("Not a valid content type");
                    return "";
            }
        } catch(ex){
            console.error(ex);
            return "";
        }
    }

    // Saving this content
    async onSaveContent(){
        try { 
            var formDetails = MyDom.getFormDetails("#displayFormSection");
            var fields = formDetails?.fields;
            var errors = formDetails?.errors;
            if(fields == undefined){
                throw new Error("No fields provided");
            }
            if(errors.length > 0){
                var errorMessage = errors.join(" ; ");
                throw new Error(errorMessage);
            }

            // Check the fields on the content to determine which ones to save
            let saveObject = {};
            for(let pair of Object.entries(fields)) {
                let key = pair[0];
                let val = pair[1];
                let match = this.ContentFields.filter( x => x.Name == key)?.[0];
                if(!(match?.ExcludeOnSave ?? false)){
                    saveObject[key] = match.EncodeOnSave ? encodeURIComponent(val) : val;
                }
            }

            // If no fields to save, then don't save anything
            if(Object.entries(saveObject).length == 0){
                throw new Error("No fields to save");
            }

            // Get JSON & save
            let jsonString = JSON.stringify(saveObject);
            console.log(jsonString);
            // Use the entity to make the API call (since it)
            // let results = this.Entity.saveContent(jsonString);
            // onCloseContent()
            MyUtils.Cookies.deleteContent();
            return true;
        } catch(ex){
            console.error(ex);
            return false;
        }
    }

    // Set the content's "save button"
    setSaveButton(){
        var oldButton = document.getElementById("contentSaveButton");
        var newButton = oldButton.cloneNode(true);
        newButton.innerHTML = `SAVE ${this.ContentType.toUpperCase()}`;
        let _hidden = (!this.Entity.CanSave) ? newButton.classList.add("hidden") : newButton.classList.remove("hidden");
        newButton.addEventListener("click", () => {
            this.onSaveContent()
        });
        oldButton.parentNode.replaceChild(newButton, oldButton);
    }

    // Set the object for this content
    setObject(entity, details){
        switch(entity.Name){
            case "Adventures":
                return new Adventure(details);
            case "Users":
                return new User(details);
            case "Groups":
                return new Group(details);
            case "Paths":
                return new Path(details);
            case "Events":
                return new Event(details);
            case "Responses":
                return new EventResponse(details);
            case "Sites":
                return new Site(details);
            case "Videos":
                return new StreamVideo(details);
            default:
                return undefined;
        }
    }
}

// A single cloudflare entity
class CloudflareEntity { 

    constructor(details, parent=undefined){
        this.Name = details?.Name ?? "";
        this.NameSingle = this.Name.substring(0, this.Name.length-1);
        this.Endpoints = details?.Endpoints ?? undefined;
        this.CanAddNew = details?.CanAddNew ?? true;
        this.CanSave = details?.CanSave ?? true;
        this.Content = [];
        this.ContentDisplay = details?.ContentDisplay ?? "pills";
        this.SortBy = details?.SortBy ?? "";
        this.Children = details?.Children?.map( y => new CloudflareEntity(y, this) ) ?? [];

        // Fluid properties
        this.ParentEntity = parent;
        this.IsChild = this.ParentEntity != undefined;
        this.CurrentContent = undefined;
        this.NewContent = undefined;
    }

    // Clicking this entity's tab
    async onClickTab(){
        try {
            console.log(this.Content);
            if(!this.IsChild){
                MyDom.hideContent(".hideOnTabSwitch");
                MyDom.setContent(".clearOnTabSwitch", {"innerHTML": ""})
            }
            this.setAddButton();

            // Set the active tab color
            let tabClass = this.IsChild ? "childTab" : "headerTab";
            MyDom.removeClass(`.${tabClass}.cfmTab`, "selected")
            MyDom.addClass(`.${tabClass}.cfmTab[data-tab-name='${this.Name}']`, "selected")

            // Load the list of content
            let contentHtml = this.Content.map( content => content.getContentHtml(this.ContentDisplay) );
            if(this.ContentDisplay.toLowerCase() == "table") {
                contentHtml = [this.#getContentTable(contentHtml)];
            }
            let listContainerID = this.IsChild ? "subTabContent" : "listOfContent"
            let listOfContent = document.getElementById(listContainerID)
            listOfContent.innerHTML = "";
            for(let html of contentHtml){
                listOfContent.appendChild(html);
            }
            let addButtonId = this.IsChild ? "#addNewSubContentButton" : "#addNewContentButton"
            let _canAddNew = (this.CanAddNew) ? MyDom.showContent(addButtonId) : MyDom.hideContent(addButtonId)

            // Add the search bar
            let searchContainerID = this.IsChild ? "subListSearch" : "searchBarContainer"
            MySearcher.addSearchBar(this.Name, `#${listContainerID}`, `#${searchContainerID}`);

            // Modifying things if NOT a child
            if(!this.IsChild){
                MyUrls.modifySearch( { "tab": this.Name, "content": "" } );
                MyUtils.Cookies.setTab(this.Name);
            }

            // Add a counter based on keydown in the input
            if(this.IsChild){
                const tableRowCounter = () => {
                    let count = getNumberOfMatches("#subTabContent tbody tr:not(.searchableHidden)");
                    let recordLabel = count == 1 ? "record" : "records";
                    MyDom.setContent("#subContentCounter", { "innerHTML": count } )
                    MyDom.setContent("#subContentCounterLabel", { "innerHTML": recordLabel } )
                }
                document.querySelector("#subListSearch .searchBarInput")?.addEventListener("keyup", tableRowCounter);
                document.querySelector("#subListSearch .searchClearIcon")?.addEventListener("click", tableRowCounter);
                tableRowCounter();
            }

            // Showing content
            let _showContent = this.IsChild ? MyDom.showContent(".showOnSubTabClick") : MyDom.showContent(".showOnTabSelected");
        } catch(ex){
            console.error(ex);
        }
    }

    // Get a tab/button for this entity, to allow clicking
    getTabButton(){
        let tag = this.IsChild ? "h4" : "h3";
        let tabClass = this.IsChild ? "childTab" : "headerTab";
        let tab = document.createElement(tag);
        tab.innerHTML = this.Name;
        tab.setAttribute("class", `${tabClass} cfmTab pointer tab margin-none`);
        tab.setAttribute("data-tab-name", this.Name);
        tab.addEventListener( "click", () => {
            this.onClickTab();
        });
        return tab; 
    }

    // Get the child tab buttons (if applicable)
    async getChildTabButtons(parentContent){
        if(this.Children.length > 0){
            let subTabsList = document.getElementById("subTabsList");
            subTabsList.innerHTML = "";
            for(let childEntity of this.Children){
                await childEntity.fetchContent(parentContent);
                let tab = childEntity.getTabButton();
                subTabsList.appendChild(tab)
            }
            MyDom.showContent(".showIfSubTabs");
        }
    }

    // Set the content's "save button"
    setAddButton(){
        var oldButton = document.getElementById("addNewContentButton");
        var newButton = oldButton.cloneNode(true);
        newButton.innerHTML = `ADD ${this.NameSingle.toUpperCase()}`;
        let _hidden = (!this.CanAddNew) ? newButton.classList.add("hidden") : newButton.classList.remove("hidden");
        newButton.addEventListener("click", () => {
            let newContent = new Content(this, {});
            newContent.onSelectContent("Add");
        });
        oldButton.parentNode.replaceChild(newButton, oldButton);
    }

    // API: Get content
    async fetchContent(parentContent=undefined){
        let type = this.Endpoints?.Type?.toLowerCase() ?? undefined
        let path = this.#getApiPath("Get", parentContent);
        if(type == undefined || path == undefined){
            return
        }
        // Make the get call based on type
        let results = []
        if(type == "kv") { 
            results = await MyCloudFlare.KeyValues("GET", path)
        } else if (type == "files") {
            results = await MyCloudFlare.Files("GET", path)
        }
        this.Content = (results.hasOwnProperty("length") ) ? results.map( obj => new Content(this, obj) ) : [new Content(this, results)];

        // If a sort is given, sort by that key
        if(this.SortBy != "" && this.SortType != ""){
            let sortKey = this.SortBy;
            console.log("Sorting");
            switch(this.SortType){
                case "Number":
                    this.Content.sort( (a,b) => { return a.Object[sortKey] - b.Object[sortKey] })
                    break;
                case "Date":
                    this.Content.sort( (a,b) => { return b.Object[sortKey] - a.Object[sortKey] })
                    break;
                default:
                    this.Content.sort( (a, b) => { return a.Object[sortKey]?.localeCompare(b.Object[sortKey]) } )
                    break;
            }
        }
    }

    // API: Save some content
    async saveContent(jsonString){
        try {
            let type = this.Endpoints?.Type?.toLowerCase() ?? undefined
            let path = this.#getApiPath("Post");
            if(type == undefined || path == undefined){
                throw new Error("Cannot process API call without type & path")
            }
            let results = [];
            if(type == "kv") { 
                results = await MyCloudFlare.KeyValues("POST", path, { body: jsonString } )
            } else if (type == "files") {
                results = await MyCloudFlare.Files("POST", path, { body: jsonString } )
            }
            // Check for errors
            if( (results?.status ?? 0) == 400){
                let msg = results?.data ?? results?.error ?? "Something went wrong"
                throw new Error(msg);
            }
        } catch(ex){
            console.error(ex);
            return false;
        }
    }

    // Helper: Get the path for an API call, filled in with variables if necessary
    #getApiPath(method, parentContent=undefined){
        let results = this.Endpoints[method] ?? undefined;
        // If a parent content is given, then do a merge field check
        if(parentContent != undefined){
            results = mergeFields(results, parentContent.Object);
        }
        return results;
    }
    
    // Set a list of contents as table
    #getContentTable(listOfContent){
        let table = document.createElement("table");
        table.classList = "cfmTable"
        table.appendChild(listOfContent[0]?.head)
        for(let content of listOfContent){
            table.appendChild(content.body);
        }
        return table;
    }
}