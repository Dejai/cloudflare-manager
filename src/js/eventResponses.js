// Load the event responses based on an advenure ID
async function loadEventResponseByID(eventID) {
    try {
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
        var response = await MyCloudFlare.Files("GET", `event/response2/?response=${responseObj.ResponseKey}`);
        var responseDetails = Array.from(Object.entries(response)).map( pair => new ResponseDetails(pair[0], pair[1]));
        responseDetails = responseDetails.filter(x => x.ResponseLabel != "" && x.ResponseLabel != 'null');
        console.log(responseDetails);

        // Show the response details
        var template = await MyTemplates.getTemplateAsync("templates/details/response-details.html", responseDetails);
        MyDom.setContent("#responseDetailsPopup", {"innerHTML": template});
    }
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

// Generate a preview time based on duration
function onGeneratePreview(){
    var time = "0m0s"
    try { 
        var duration = MyDom.getContent("#fileDuration")?.value ?? "";
        var percent = MyDom.getContent("#previewTimePercent")?.value ?? "";
        if(duration == "" || percent == ""){
            throw new Error("Missing duration or percent");
        }
        percent = Number(percent);
        duration = Number(duration);
        // Get percentage of duration
        var percentage = percent / 100;
        var videoTime = Math.floor( (duration * percentage) );
        // var quarterWay = Math.floor( (duration * 0.25) );
        var minute = Math.floor( (videoTime / 60) );
        var seconds = Math.ceil( (videoTime % 60) );
        time = `${minute}m${seconds}s`;
    } catch(err){
        MyLogger.LogError(err);
    } finally {
        MyDom.setContent("#preview", {"value": time});
    }
}