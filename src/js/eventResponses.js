// Load the event responses based on an advenure ID
async function loadEventResponseByID(eventID) {
    try {

        await onSyncEntity("EventResponses", "events/responses");

        MyDom.showContent(".showOnResponsesLoading");
        MyDom.setContent("#listOfEventResponses", {"innerHTML": ""});
        var responses = (eventID != "") ? await MyCloudFlare.Files("GET",`/event/responses/?key=${eventID}`) : [];
        var eventRepsonses = responses.map( vid => new EventResponse(vid));
        if(eventRepsonses.length > 0){
            MySearcher.addSearchBar("Responses", "#listOfEventResponses", "#responsesSearchSection");
        }
        eventRepsonses.sort( (a,b) => { return b.ResponseDate - a.ResponseDate });
        MyPageManager.addContent("Responses", eventRepsonses);
        var rowsTemplate = await MyTemplates.getTemplateAsync(`templates/rows/response-row.html`, eventRepsonses);
        MyDom.setContent("#listOfEventResponses", {"innerHTML": rowsTemplate});
        MyDom.showContent(".showOnResponsesLoaded");
        MyDom.hideContent(".hideOnResponsesLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Open the modal
async function onSelectResponse(cell){
    row = cell.closest("tr");
    var contentID = row?.getAttribute("data-content-id") ?? "";
    if (contentID != "") {
        onSetSelectedRow(row);

        var responseObj = MyPageManager.getContentByKey("Responses")?.filter(x => x.ResponseKey == contentID)?.[0];

        // Fill in user Details
        var user = MyPageManager.getContentByKey("Users")?.filter(x => x.UserKey == responseObj.User)?.[0];
        MyDom.setContent("#responseUsername", {"innerHTML": `${user.FirstName} ${user.LastName}`});

        // Show the popup, with a loading
        let spinnerIcon = `<i class="fa-solid fa-spinner dtk-spinning dtk-spinning-1500" style="font-size:200%;"></i>`
        MyDom.setContent("#responseDetailsPopup", {"innerHTML": spinnerIcon});
        MyDom.addClass("#responseDetailsModal.modalContainer", "open");        

        // Get the response details
        var responseDetails = await onGetResponseDetails(responseObj.ResponseKey);

        // Show the response details
        var template = await MyTemplates.getTemplateAsync("templates/details/response-details.html", responseDetails);
        MyDom.setContent("#responseDetailsPopup", {"innerHTML": template});
    }
}

// Get the details of a response (by key)
async function onGetResponseDetails(responseKey) {
     // Get the response details
     var response = await MyCloudFlare.Files("GET", `event/response2/?response=${responseKey}`);
     var responseDetails = Array.from(Object.entries(response)).map( pair => new ResponseDetails(pair[0], pair[1]));
     responseDetails = responseDetails.filter(x => x.ResponseLabel != "" && x.ResponseLabel != 'null');
     return responseDetails
}

// Close the modal
function onCloseModal(refesh=false){
    MyDom.removeClass(".modalContainer", "open");
    if(refesh){
        var advID = MyUrls.getSearchParam("content") ?? "";
        loadEventResponseByID(advID);
    }
}

// Save the edits to a fieldl (and entire row)
async function onSaveFile(button) {

    var saveStatus = new SaveStatus(button);
    saveStatus.saving();

    try {
        var formDetails = MyDom.getFormDetails("#fileModalForm");
        var fields = formDetails["fields"] ?? {};
        var errors = formDetails["errors"] ?? [];
        
        if(errors.length > 0){
            var errorMessage = errors.join(" ");
            saveStatus.error(errorMessage);
            return;
        }

        // Submit this one to be saved in Cloudflare
        var results = { "status": 400 };
        var videoID = fields?.contentID;
        var results = await MyCloudFlare.Responses("POST", `/stream/?video=${videoID}`, { body: JSON.stringify(fields)} );
        var message = results?.message ?? "OK";
        if(message != "OK"){
            throw new Error(message);
        }
        saveStatus.results(results, "File");

        // Determine if to close modal or go next
        setTimeout( ()=> {
            var saveAndNext = document.querySelector("#nextFile")?.checked ?? false;
            if(saveAndNext){ 
                onNavigateFile("next");
                MyDom.setContent("#nextFile", {"checked":""});
            } else { 
                onCloseModal(true);
            }
        }, 2000);

        
    } catch(err){
        MyLogger.LogError(err);
        saveStatus.error(err.message, 10);
    }
}

// Set the currently selected file row
function onSetSelectedRow(row){
    MyDom.removeClass("tr.selectedRow", "selectedRow");
    row.classList.add("selectedRow");
}

// Go to the prev file
async function onNavigateResponse(direction="next"){
    var rows = Array.from(document.querySelectorAll("#eventResponses .responseRow"));
    var contentIDs = rows.map(x => x.getAttribute("data-content-id"));
    var currRow = rows.filter(x => x.classList.contains("selectedRow"))?.[0]?.getAttribute("data-content-id") ?? "";
    var rowIdx = contentIDs.indexOf(currRow);
    var nextRow = (direction == "next") ? rows[rowIdx+1] : (direction == "prev") ? rows[rowIdx-1] : undefined;
    if(nextRow != undefined){
        nextRow.querySelector(".fieldCell").click();
    } else { 
        MyDom.setContent("#responseDetailsModal #navMessage", {"innerText": "Reached end of the list."});
        setTimeout( ()=> {
            MyDom.setContent("#responseDetailsModal #navMessage", {"innerText": ""});
        }, 2000);
    }
}

// Summarize the responses (based on label) for an event
async function onSummarizeEventResponses(button){
    
    var saveStatus = new SaveStatus(button);
    saveStatus.info("Summarizing ...");

    try {
        var summaryVisible = !document.querySelector("#eventSummarySubsection")?.classList.contains("hidden") ?? false;
        if(summaryVisible){
            throw new Error("Already visible");
        }

        let eventKey = MyDom.getContent("#eventDetailsSection #eventKey")?.value + "_";

        // Get the list of indexed responses
        var responses = await MyCloudFlare.Files("GET", "event/response2");
        responses = responses.filter(x => x.key?.startsWith(eventKey));

        //  Clear stored responses & reload
        MyPageManager.removeContent("ResponseSummary");

        // Loop through responses & map
        for(var resp of responses)
        {
            let userKey = resp["key"]?.replace(eventKey, "");
            for(var keyPair of Object.entries(resp))
            {
                let label = keyPair[0];
                let value = keyPair[1];
                if(label == "null" || label == "key"){
                    continue;
                }

                // Get existing summary?
                var summary = MyPageManager.getContentByKey("ResponseSummary")?.filter(x => x.ResponseLabel == label)?.[0] ?? undefined;
                if(summary == undefined){
                    summary = new EventResponseSummary(label);
                    MyPageManager.addContent("ResponseSummary", [summary]);
                }

                // Setting the appropriate summary value
                if(label == "comments" && value != ""){
                    summary.addResponse(`${value} <br/><span style="margin-left:3%;">- <em>${userKey}</em></span>`);
                } else if (value.startsWith("Yes") || value.startsWith("Maybe")){
                    var pref = value.split(" ")?.[0]?.replace(",", "");
                    summary.addResponse(`${pref} <span style="margin-left:1%;">- <em>${userKey}</em></span>`);
                }
            }
        }
        saveStatus.info("RESPONSES");
    
        // Get summary & display
        var eventResponseSummary = MyPageManager.getContentByKey("ResponseSummary");
        var template = await MyTemplates.getTemplateAsync("templates/options/event-response-label-tab.html", eventResponseSummary);
        MyDom.setContent("#eventSummaryLabels", {"innerHTML": template});
    
        MyDom.hideContent(".hideOnResponseSummary");
        MyDom.showContent(".showOnResponseSummary");
    } catch(err){
        MyLogger.LogError(err);

        // Do the flip to make sure things are back to visible
        MyDom.showContent(".hideOnResponseSummary");
        MyDom.hideContent(".showOnResponseSummary");
        MyDom.hideContent("#eventSummaryDetails");
        saveStatus.info("SUMMARY");

    }

}

// Show the response details
async function onShowResponseSummary(tab){
    var label = tab.innerText;
    var summary = MyPageManager.getContentByKey("ResponseSummary")?.filter(x => x.ResponseLabel == label)?.[0] ?? undefined;
    MyDom.removeClass(".event-response-tab", "active");
    if(summary != undefined) 
    {
        tab.classList.add("active");
        var responseList = summary.ResponseList.map(x => { return { "Response": x}});
        MyDom.setContent("#eventSummaryLabelCount", {"innerHTML": responseList.length});
        var template = await MyTemplates.getTemplateAsync("templates/rows/response-summary-row.html", responseList);
        MyDom.setContent("#eventSummaryList", {"innerHTML": template});
        MyDom.showContent("#eventSummaryDetails");
    }
}

// Toggling back 