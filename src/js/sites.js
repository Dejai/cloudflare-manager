

// Get the list of sites
async function onGetSites(){
    var sites = await MyCloudFlare.KeyValues("GET", "/sites");
    sites = sites.map(result => new Site(result));
    MyPageManager.addContent("Sites", sites);

    // Load content after getting
    await onLoadSites();
    loadTabFromUrl("sites");
}

// LOAD: Adding the formatted content to the page (may be hidden)
async function onLoadSites(){
    var sites = MyPageManager.getContentByKey("Sites");
    sites.sort( (a, b) => { return a.Key.localeCompare(b.Key) });
    var siteList = await MyTemplates.getTemplateAsync("templates/lists/site-list.html", sites);
    MyDom.setContent("#listOfSites", {"innerHTML": siteList});
}

// SHOW: Showing the entity when the tab is clicked
async function onShowSites() {
    try {
        onSetActiveTab("sites");
        loadContentFromURL();

        // Add user search bar
        MySearcher.addSearchBar("Sites", "#listOfSites", "#searchSites");
        
        MyDom.hideContent(".hideOnSitesLoaded");
        MyDom.showContent(".showOnSitesLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Site & its files
async function onSelectSite(option){
    try {
        var key = option.getAttribute("data-site-key") ?? "";
        MyUrls.modifySearch({"tab" : "sites", "content":key});
        var site = MyPageManager.getContentByKey("Sites")?.filter(x => x.Key == key)?.[0];
        MyDom.fillForm("#siteDetailsForm", site);

        onSetSelectedEntity(key);
        
        MyDom.hideContent(".hideOnSiteSelected");
        MyDom.showContent(".showOnSiteSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSaveSiteDetails(button){

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    try {

        // Get fields
        var formDetails = MyDom.getFormDetails("#siteDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            saveStatus.error(errorMessage);
            return;
        }
        fields["value"] = encodeURIComponent(fields["site"]);

        // Update existing or add new site
        var site = MyPageManager.getContentByKey("Sites")?.filter(x => x.Key == fields.key)?.[0];
        if(site != undefined){
            site.update(fields);
        } else {
            var newSite = new Site(fields);
            MyPageManager.addContent("Sites", newSite);
            MyUrls.modifySearch({"content":fields.key});
        }

        // Save changes in cloudflare
        var results = await MyCloudFlare.KeyValues("POST", "/site", { body: JSON.stringify(fields) });
        saveStatus.results(results);

        // Reload list of sites
        onShowSites();

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 10);
    }
}

async function onAddSite(){
    MyDom.fillForm("#siteDetailsForm", {});
    MyDom.hideContent(".hideOnSiteSelected");
    MyDom.showContent(".showOnSiteSelected");
}


// Open preview of a site
async function onOpenSite(button) {
    try {
        let container = button.closest("#siteDetailsForm");
        let key = MyDom.getContent("[name='key']", container)?.value ?? "";
        var site = MyPageManager.getContentByKey("Sites")?.filter(x => x.Key == key)?.[0];
        if(site != undefined){
            MyUrls.navigateTo(site.Site, "_blank");
        }
    } catch(err) {
        MyLogger.LogError(err);
    }
    
}

async function onCopySiteCode(button){
    try{
        let container = button.closest("#siteDetailsForm");
        let key = MyDom.getContent("[name='key']", container)?.value ?? "";
        var site = MyPageManager.getContentByKey("Sites")?.filter(x => x.Key == key)?.[0];
        if(site != undefined){

            let siteUrl = site.getUrl();

            MyDom.hideContent("#copySitePreview");
            MyDom.showContent("#copySiteMessage");

            // Copy the text inside the text field
            navigator.clipboard.writeText(siteUrl);
           
        }
    } catch(err){
        MyLogger.LogError(err);
    } finally {
        // Reset copy
        setTimeout( ()=> {
            MyDom.showContent("#copySitePreview");
            MyDom.hideContent("#copySiteMessage");
        }, 2000);
    }
}