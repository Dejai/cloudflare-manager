/* FORMS */
class FormField {
    constructor(details){
        this.Type = details?.Type ?? "input";
        this.Label = details?.Label ?? "Default";
        this.Name = details?.Name ?? "";
        this.Value = details?.Value ?? "";
        this.Required = details?.Required ? "required" : "";
        this.Hidden = details?.Hidden ? "hidden" : ""; 
        this.Options = details?.Options ?? [];

        this.ShowInTable = details?.ShowInTable ?? true;
        this.ExcludeOnSave = details?.ExcludeOnSave ?? false;
        this.EncodeOnSave = details?.EncodeOnSave ?? false;
        this.Html = this.setHtml();
    }

    // set the HTML based on type
    setHtml(){
        switch(this.Type){
            case "info":
                return `<h3>${this.Label}: ${this.Value}</h3>`;

            case "link":
                return `<i class="fa-solid fa-eye pointer color-blue" data-href="${this.Value}" onclick="MyUrls.navigateTo(this.getAttribute('data-href'), '_blank')" /> ${this.Label}`;

            case "input":
                return `<label for="${this.Name}">${this.Label}:</label><br/>
                        <input type="text" name="${this.Name}" class="width-70 width-20-desktop" placeholder="Enter ${this.Name}" value="${this.Value}" ${this.Required} ${this.Hidden} />`; 

            case "textarea":
                return `<label for="${this.Name}">${this.Label}:</label><br/>
                         <Textarea  class="width-70 width-20-desktop" type="text" name="${this.Name}" placeholder="Enter ${this.Name}" value="${this.Value}" ${this.Required} rows="10"/>${this.Value}</Textarea>`;

            case "select":
                let promptList = "";
                for(let option of this.Options){
                    let label = option;
                    let val = option;
                    if(typeof(option) == "object"){
                        label = option[0] ?? ""
                        val = option[1] ?? ""
                    }
                    if(label != "" && val != ""){
                        promptList += `<option value=${val}>${label}</option>`
                    }
                }
                        return `<label for="${this.Name}">${this.Label}:</label><br/>
                        <select  class="width-70 width-20-desktop" value="${this.Value}" ${this.Required}>${promptList}</select>`;

            default:
                return `${this.Label}: ${this.Value}`
        }
    }
}


class FormFieldInfo { 
    constructor(label, inputName, inputValue="", required=false){
        this.Label = label;
        this.Name = inputName;
        this.Value = inputValue;
        this.Required = (required) ? "required" : ""
        this.Html = this.setHtml();
    }

    setHtml(){
        return `<h3>${this.Label}: ${this.Value}</h3>`
    }
}

class FormFieldLink { 
    constructor(label, inputName, inputValue="", required=false){
        this.Label = label;
        this.Name = inputName;
        this.Value = inputValue;
        this.Required = (required) ? "required" : ""
        this.Html = this.setHtml();
    }

    setHtml(){
        return `<i class="fa-solid fa-eye pointer color-blue" data-href="${this.Value}" onclick="MyUrls.navigateTo(this.getAttribute('data-href'), '_blank')" /> ${this.Label}`
    }
}

class FormFieldInput { 
    constructor(label, inputName, inputValue="", required=false){
        this.Label = label;
        this.Name = inputName;
        this.Value = inputValue;
        this.Required = (required) ? "required" : ""
        this.Html = this.setHtml();
    }

    setHtml(){
        return `<label for="${this.Name}">${this.Label}:</label><br/>
                <input type="text" name="${this.Name}" class="width-70 width-20-desktop" placeholder="Enter ${this.Name}" value="${this.Value}" ${this.Required} />`
    }
}

class FormFieldTextArea { 
    constructor(label, inputName, inputValue="", required=false){
        this.Label = label;
        this.Name = inputName;
        this.Value = inputValue;
        this.Required = (required) ? "required" : ""
        this.Html = this.setHtml();
    }

    setHtml(){
        return `<label for="${this.Name}">${this.Label}:</label><br/>
                <Textarea  class="width-70 width-20-desktop" type="text" name="${this.Name}" placeholder="Enter ${this.Name}" value="${this.Value}" ${this.Required} rows="10"/>${this.Value}</Textarea>`
    }
}

class FormFieldSelect {
    constructor(label, fieldName, fieldValue="", options=[], required=false){
        this.Label = label;
        this.Name = fieldName;
        this.Value = fieldValue;
        this.Required = (required) ? "required" : ""
        this.Html = this.setHtml(options)

    }

    setHtml(options){
        let promptList = "";
        for(let option of options){
            let label = option;
            let val = option;
            if(typeof(option) == "object"){
                label = option[0] ?? ""
                val = option[1] ?? ""
            }
            if(label != "" && val != ""){
                promptList += `<option value=${val}>${label}</option>`
            }
        }
        return `<label for="${this.Name}">${this.Label}:</label><br/>
                <select  class="width-70 width-20-desktop" value="${this.Value}" ${this.Required}>${promptList}</select>`
    }
}
