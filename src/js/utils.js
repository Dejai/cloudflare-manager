
// Get the prefix on a date value
function dateValueFormat(val){
    return (val < 10) ? "0"+val : ""+val;
}

// Format a date in a way that I want;
Object.defineProperty(Date.prototype, "ToDateFormat", {
    value: function ToDateFormat(format) {
        let yyyy = dateValueFormat(this.getFullYear());
        let dd = dateValueFormat(this.getDate());
        let MM = dateValueFormat(this.getMonth()+1);
        let hh = dateValueFormat(this.getHours());
        let mm = dateValueFormat(this.getMinutes());
        let ss = dateValueFormat(this.getSeconds());
        var tt = hh < 12 ? "AM" : "PM";

        // Return formatted format
        format = format
                    .replaceAll("yyyy",yyyy)
                    .replaceAll("dd",dd)
                    .replaceAll("MM",MM)
                    .replaceAll("hh",hh)
                    .replaceAll("mm",mm)
                    .replaceAll("ss",ss)
                    .replaceAll("tt",tt)
        return format;
    },
    writable: true,
    configurable: true,
});


// Doing the sync functionality
async function onSyncEntity(entityType, syncPath="")
{
    try {
        console.log("Syncing new way: " + entityType);
        var entityTypeLower = entityType.toLowerCase();

        // Show state of syncing
        MyDom.showContent(`.showOn${entityType}Syncing`);
        var statusSelector = `#${entityTypeLower}TabSection .objectSyncMessage .status`
        MyDom.setContent(statusSelector, {"innerText": "Syncing"});

        // Get sync status from Cloudflare
        syncPath = (syncPath != "") ? syncPath : `/${entityTypeLower}/sync`;
        var sync = await MyCloudFlare.Files("GET", syncPath);

        // Show sync date
        var syncDate = (new Date(sync?.lastSync)).ToDateFormat("yyyy-MM-dd at hh:mm:ss tt");
        var lastSyncMessage = `Last synced: <span style="margin-left:0.5%"><em>${syncDate}</em></span>`;
        MyDom.setContent(statusSelector, {"innerHTML": lastSyncMessage } );

        // Hide sync content
        MyDom.hideContent(`.hideOn${entityType}Synced`);

    } catch (err){
        MyLogger.LogError(err);
    } finally {
        return;
    }
}