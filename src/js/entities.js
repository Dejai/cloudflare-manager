class EntityManager {
    constructor(){
        this.EntityMap = {}

        // Current managed things
        this.Entity = undefined;
        this.Content = undefined; 
    }
    mapEntity(key, obj){
        this.EntityMap[key] = obj
    }

    // Getters
    getEntity(){ return this.Entity }
    getEntityByKey(key){ this.setEntity(key); return this.Entity; }
    getContentDetails(){ return this.Content }
    
    // Setters
    setEntity(key){ this.Entity = this.EntityMap[key] ?? undefined; }
}

// Mapping the JSON to models
const EntityMap = (name, content) => {
    try { 
        switch(name){
            case "Adventures":
                return content.map( x => new Adventure(x) )
            case "Users":
                return content.map( x => new User(x) )
            case "Groups":
                return content.map( x => new Group(x) )
            case "Paths":
                return content.map( x => new Path(x) )
            case "Events":
                return content.map( x => new Event(x) )
            case "EventResponses":
            case "Responses":
                return content.map( x => new EventResponse(x) )
            case "Sites":
                return content.map( x => new Site(x) )
            default:
                console.error("Could not map this type of Entity: " + name);
                return []
        }
    } catch(ex){
        console.error(ex);
        return [];
    }
}

// A single cloudflare entity
class CloudflareEntity { 

    constructor(details, parent=undefined){
        this.Name = details?.Name ?? "";
        this.Endpoints = details?.Endpoints ?? undefined;
        this.Display = details?.Display ?? "Pills";
        this.CanAddNew = details?.CanAddNew ?? true;
        this.Content = [];
        this.Children = details?.Children?.map( y => new CloudflareEntity(y, this) ) ?? [];

        // Fluid properties
        this.ParentEntity = parent;
        this.CurrentContent = undefined;
        this.NewContent = undefined;
    }

    // Creating a new content entry
    createNewContent(){
        this.NewContent = EntityMap(this.Name, [{}])?.[0]
        return this.NewContent
    }

    // Set current content (that is being viewed/managed)
    setCurrentContent(content=undefined){
        this.CurrentContent = content
    }

    // Set the menu list HTML
    async getContentListHtml(){
        let template = "";
        if(this.Content.length == 0){
            return `<p>No ${this.Name} Found</p>`;
        }
        
        switch(this.Display){
            case "Pills":
                let contentMap = this.Content.map( x => x.getContentDetails() );
                template = await MyTemplates.getTemplateAsync("templates2/entityCard.html", contentMap );
                break;
            case "Table":
                let contentFields = this.Content.map( x => x.getFields() );
                let headerRow = "";
                let tableRows = "";
                for(let fields of contentFields){
                    if(headerRow == ""){
                        headerRow = fields.map( field => field.Label )?.map( label => label.ToHtml("th") )?.join("")?.ToHtml("tr");
                    } else { 
                        tableRows += fields.map( field => field.Value )?.map( value => value.ToHtml("td") )?.join("")?.ToHtml("tr", `class="searchable"`);
                    }
                }
                template = await MyTemplates.getTemplateAsync("templates2/table/table.html", { "Header": headerRow, "Body": tableRows } );
                break;
            default:
                template = `<p>Display Type Not Found: ${this.Display}</p>`;
                break;
        }
        return template;
    }

    // Get the entity tabs/subtabs
    async getTabHtml(){ 
        return await MyTemplates.getTemplateAsync(`templates2/tabs/headerTab.html`, { "Name": this.Name } ); 
    }
    async getChildTabsHtml(){ 
        return await MyTemplates.getTemplateAsync(`templates2/tabs/childTab.html`, this.Children ); 
    }

    // Get one of the content items based on content ID 
    getMatchingContent(contentID){
        return this.Content?.filter( x => x.getContentDetails()?.ContentID == contentID )?.[0] ?? undefined;
    }
    // Get one of the child entities based on name
    getMatchingChildEntity(name){
        return this.Children?.filter( x => x.Name == name )?.[0] ?? undefined
    }


    // API: Get content
    async fetchContent(){
        let type = this.Endpoints?.Type?.toLowerCase() ?? undefined
        let path = this.#getApiPath("Get");
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
        this.Content = EntityMap(this.Name, results)
    }

    // Saving the values of the content
    async saveContent(fieldsJson){
        let type = this.Endpoints?.Type?.toLowerCase() ?? undefined
        let path = this.#getApiPath("Post");
        if(path == undefined || type == undefined || fieldsJson == undefined || this.CurrentContent == undefined){
            console.log("leaving early")
            return "Some required fields are missing";
        }

        // Update the current content with the fields
        this.CurrentContent.UpdateFields(fieldsJson)

        // If it's new content, then save it to the list
        if(this.NewContent != undefined) { 
            this.Content.push(this.NewContent)
        }

        // Save the JSON string
        let hasToJson = typeof this.CurrentContent?.toJson == "function"
        if(!hasToJson){
            console.log("Can't save without custom toJson() function")
            return "Cannot save this entity without a custom toJson() function"
        }
        let jsonString = JSON.stringify(this.CurrentContent.toJson());

        // Make call based on type
        let results = [];
        if(type == "kv") { 
            results = await MyCloudFlare.KeyValues("POST", path, { body: jsonString } )
        } else if (type == "files") {
            results = await MyCloudFlare.Files("POST", path, { body: jsonString } )
        }

        // Check for errors
        if(results?.status ?? "" == 400){
            return results?.data ?? results?.error ?? "Something went wrong"
        }
        
        return "";
    }

    // Helper: Get the path for an API call, filled in with variables if necessary
    #getApiPath(method){
        let results = this.Endpoints[method] ?? undefined;

        // First, add merge fields from current content
        results = mergeFields(results, this.CurrentContent);

        // Then, merge fields from the parent content
        results = mergeFields(results, this.ParentEntity?.CurrentContent);

        return results;
    }
    
}