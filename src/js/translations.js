

// Get the list of translations
async function getListOfTranslations(){
    var translations = await MyFetch.call("GET", `https://files.dejaithekid.com/translations/`);
    translations = translations.map(result => new Translation(result));
    translations.sort( (a, b) => { return a.Code.localeCompare(b.Code) });
    MyPageManager.addContent("Translations", translations);
}

async function onShowTranslations() {
    try {
        MyDom.hideContent(".hideOnTabSwitch");
        var translationList = await MyTemplates.getTemplateAsync("templates/lists/translation-list.html", MyPageManager.getContent("Translations") );
        MyDom.setContent("#listOfTranslations", {"innerHTML": translationList});
        onSetActiveTab("translations");
        loadContentFromURL();

        // Add user search bar
        MySearcher.addSearchBar("Translations", "#listOfTranslations", "#searchTranslations");
        
        MyDom.hideContent(".hideOnTranslationsLoaded");
        MyDom.showContent(".showOnTranslationsLoaded");
        loadContentFromURL();
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Get the Translation & its files
async function onSelectTranslation(option){
    try {
        var key = option.getAttribute("data-translation-key") ?? "";
        MyUrls.modifySearch({"tab" : "translations", "content":key});
        var translation = MyPageManager.getContent("Translations")?.filter(x => x.Code == key)?.[0];
        MyDom.fillForm("#translationDetailsForm", translation);
        MyDom.hideContent(".hideOnTranslationSelected");
        MyDom.showContent(".showOnTranslationSelected");
    } catch (err) {
        MyLogger.LogError(err);
    }
}

// Save Adventure details
async function  onSaveTranslationDetails(){
    try {
        var formDetails = MyDom.getFormDetails("#translationDetailsForm");
        var fields = formDetails?.fields;
        var errors = formDetails?.errors;
        if(errors.length > 0){
            var errorMessage = errors.join(" ; ");
            MyPageManager.errorMessage(errorMessage, 10);
            return;
        }

        // Save changes in cloudflare
        var results = await MyFetch.call("POST", "https://files.dejaithekid.com/translation", { body: JSON.stringify(fields) });
        MyPageManager.setResultsMessage(results);

    } catch(err){
        MyLogger.LogError(err);
        MyPageManager.errorMessage(err.Message, 10);
    }
}

async function onAddTranslation(){
    MyDom.fillForm("#translationDetailsForm", {});
    MyDom.hideContent(".hideOnTranslationSelected");
    MyDom.showContent(".showOnTranslationSelected");
}