// Load the adventure files based on an advenure ID
async function loadAdventureFilesByID(adventureID) {
    try {
        MyDom.showContent(".showOnFilesLoading");
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": ""});
        var adventureVideos = (adventureID != "") ? await MyCloudFlare.Files("GET",`/stream/?search=${adventureID}`) : [];
        var streamVideos = adventureVideos.map( vid => new StreamVideo(vid));
        streamVideos.sort( (a,b) => { return a.Order - b.Order });
        MyPageManager.addContent("Files", streamVideos);
        var templateName = streamVideos.length > 0 ? "file-row" : "file-row-empty";
        var fileRowsTemplate = await MyTemplates.getTemplateAsync(`templates/rows/${templateName}.html`, streamVideos);
        MyDom.setContent("#listOfAdventureFiles", {"innerHTML": fileRowsTemplate});
        MyDom.showContent(".showOnFilesLoaded");
        MyDom.hideContent(".hideOnFilesLoaded");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Open the modal
function onSelectFile(cell){
    row = cell.closest("tr");
    var contentID = row?.getAttribute("data-content-id") ?? "";

    if (contentID != "") {
        onSetSelectedRow(row);
        MyDom.setContent("#previewTimePercent", {"value": "0"});
        var file = MyPageManager.getContentByKey("Files")?.filter(x => x.ContentID == contentID)?.[0];
        MyDom.fillForm("#fileModalForm", file);
        MyDom.addClass("#fileFormModal.modalContainer", "open");
    }
}

// Close the modal
function onCloseModal(refesh=false){
    MyDom.removeClass(".modalContainer", "open");
    if(refesh){
        var advID = MyUrls.getSearchParam("content") ?? "";
        loadAdventureFilesByID(advID);
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
        var results = await MyCloudFlare.Files("POST", `/stream/?video=${videoID}`, { body: JSON.stringify(fields)} );
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
async function onNavigateFile(direction="next"){
    var rows = Array.from(document.querySelectorAll("#adventureFiles .fileRow"));
    var contentIDs = rows.map(x => x.getAttribute("data-content-id"));
    var currRow = rows.filter(x => x.classList.contains("selectedRow"))?.[0]?.getAttribute("data-content-id") ?? "";
    var rowIdx = contentIDs.indexOf(currRow);
    var nextRow = (direction == "next") ? rows[rowIdx+1] : (direction == "prev") ? rows[rowIdx-1] : undefined;
    if(nextRow != undefined){
        nextRow.querySelector(".fieldCell").click();
    } else { 
        MyDom.setContent("#navMessage", {"innerText": "Reached end of the list."});
        setTimeout( ()=> {
            MyDom.setContent("#navMessage", {"innerText": ""});
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