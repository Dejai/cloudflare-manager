// GET: Getting the entity from Cloudflare
async function onGetEvents(){

    // Always start with a sync check
    await onSyncEntity("Events");

    // Get the actual events & save to page manager
    var events = await MyCloudFlare.Files("GET", "/events");
    events = events.map(result => new Event(result));
    MyPageManager.addContent("Events", events);

    // Load the content
    await onLoadEvents();
    loadTabFromUrl("events");
}

// LOAD: Adding the formatted content to the page (may be hidden)
async function onLoadEvents(){
    var events = MyPageManager.getContentByKey("Events");
    events.sort( (a, b) => { return a.Name.localeCompare(b.Name) });
    var eventList = await MyTemplates.getTemplateAsync("templates/lists/event-list.html", events );
    MyDom.setContent("#listOfEvents", {"innerHTML": eventList});
}

// SHOW: Showing the entity when the tab is clicked
async function onShowEvents(){
    try {
        onSetActiveTab("events");
        loadContentFromURL();

        // Set the group options in the event details form
        var groupOpts = await MyTemplates.getTemplateAsync("templates/options/group-option.html", MyPageManager.getContentByKey("Groups"));
        MyDom.setContent("#eventDetailsForm #accessGroup", {"innerHTML": "<option></option>" + groupOpts});
        
        MyDom.hideContent(".hideOnEventsLoaded");
        MyDom.showContent(".showOnEventsLoaded");
        MyDom.showContent("#eventsTabSection");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// SELECT: Pick an event and show it's content
async function onSelectEvent(option){
    try{
        var eventID = option.getAttribute("data-event-id") ?? "";
        MyUrls.modifySearch({"tab" : "events", "content":eventID});
        var event = MyPageManager.getContentByKey("Events")?.filter(x => x.EventKey == eventID)?.[0];
        MyDom.fillForm("#eventDetailsForm", event);   

        MyDom.setContent("#eventPreviewLink", {"href": `https://adventures.dejaithekid.com/events/?id=${event.EventID}`})
        
        loadEventResponseByID(eventID);
        onSetSelectedEntity(eventID);

        MyDom.hideContent(".hideOnEventSelected");
        MyDom.showContent(".showOnEventSelected");

    } catch(err){
        MyLogger.LogError(err);
    }

}

// Add a new group
async function onAddEvent(){
    var eventID = MyHelper.getCode(22, "mix")?.toLowerCase();
    MyDom.fillForm("#eventDetailsForm", { "EventID": eventID } );
    MyDom.hideContent(".hideOnEventSelected");
    MyDom.showContent(".showOnEventSelected");
    MyUrls.replaceSearch({"tab" : "events" });
    loadEventResponseByID(eventID);
    onSetSelectedEntity(eventID);
}

// SAVE: Save Event details
async function  onSaveEventDetails(button){

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();
    
    try {
        // Get form details
        var formDetails = MyDom.getFormDetails("#eventDetailsForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];

        // If _Default, just return
        if(fields?.eventID == 0){
            saveStatus.info("Cannot save _Default event", 3);
            return;
        }

        if(errors.length > 0){
            var errorMessage = errors.join(" / ");
            saveStatus.error(errorMessage);
            return;
        }

        // Update existing or add new event
        var event = MyPageManager.getContentByKey("Events")?.filter(x => x.EventID == fields?.eventID)?.[0];
        if(event != undefined){
            event.update(fields);
        } else { 
            var newEvent = new Event(fields);
            MyPageManager.addContent("Events", newEvent);
            MyUrls.modifySearch({"content": newEvent.EventID});
        }

        // Submit this one to be saved in Cloudflare
        var results = await MyCloudFlare.Files("POST", `/event/`, { body: JSON.stringify(fields)} );
        saveStatus.results(results, "Event");

        // Reload the list after saving.
        onShowEvents();

    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 7);
    }
}

