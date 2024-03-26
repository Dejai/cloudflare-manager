/* FORMS */
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
                <input type="text" name="${this.Name}" placeholder="Enter ${this.Name}" value="${this.Value}" ${this.Required} />`
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
                <Textarea type="text" name="${this.Name}" placeholder="Enter ${this.Name}" value="${this.Value}" ${this.Required} rows="10" class="width-100"/>${this.Value}</Textarea>`
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
                <select value="${this.Value}" ${this.Required}>${promptList}</select>`
    }
}
