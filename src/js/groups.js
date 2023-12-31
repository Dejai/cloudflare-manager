

// Get the list of groups
async function getListOfGroups(){
    var groups = await MyCloudFlare.KeyValues("GET", "/groups");
    groups = groups.map(result => new Group(result));
    groups.sort( (a, b) => { return a.Value.localeCompare(b.Value) });
    MyPageManager.addContent("Groups", groups);
}

async function onShowGroups() {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var groupList = await MyTemplates.getTemplateAsync("templates/lists/group-list.html", MyPageManager.getContent("Groups") );
        MyDom.setContent("#listOfGroups", {"innerHTML": groupList});
        onSetActiveTab("groups");
        loadContentFromURL();
        MyDom.hideContent(".hideOnGroupsLoaded");
        MyDom.showContent(".showOnGroupsLoaded");
        loadContentFromURL();
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Group & its files
async function onSelectGroup(option){
    try {
        var key = option.getAttribute("data-group-key") ?? "";
        MyUrls.modifySearch({"tab" : "groups", "content":key});
        var group = MyPageManager.getContent("Groups")?.filter(x => x.Key == key)?.[0];
        MyDom.fillForm("#groupDetailsForm", group);
        MyDom.hideContent(".hideOnGroupSelected");
        MyDom.showContent(".showOnGroupSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSaveGroupDetails(){
    try {
        var formDetails = MyDom.getFormDetails("#groupDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }

        // Save changes in cloudflare
        var results = await MyCloudFlare.KeyValues("POST", "/group", { body: JSON.stringify(fields) });
        MyPageManager.setResultsMessage(results);

    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }
}

// Add a new group
async function onAddGroup(){
    MyDom.fillForm("#groupDetailsForm", {});
    MyDom.hideContent(".hideOnGroupSelected");
    MyDom.showContent(".showOnGroupSelected");
    MyUrls.replaceSearch({"tab" : "groups" });
}


function fillForm2(formID, formObj) {
    var formSelector = formID?.replace("#", "");
    var formFields = document.querySelectorAll(`#${formSelector} [name]`);
    var objectKeys = Object.keys(formObj);
    for(var field of formFields){
        var fieldKey = field.getAttribute("name");
        var pascalKey = fieldKey.substring(0,1).toUpperCase() + fieldKey.substring(1);
        // Setting the value
        var valueToSet = (objectKeys.includes(pascalKey)) ? formObj[pascalKey] : "";
        field.value = valueToSet;
        if(field.tagName == "TEXTAREA"){
            field.innerText = valueToSet;
        }
    }
    // for(var key of Object.keys(formObj)) {
    // 	var camelKey = key.substring(0,1).toLowerCase() + key.substring(1);
    // 	var fieldValue = formObj[key];
    // 	var field = document.querySelector(`#${formSelector} [name="${camelKey}"]`);
    // 	if(field != undefined){
    // 		field.value = fieldValue;
    // 		if(field.tagName == "TEXTAREA") {
    // 			field.innerText = fieldValue;
    // 		} 
    // 	}
    // }
}