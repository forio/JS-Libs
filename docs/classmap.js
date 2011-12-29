YAHOO.env.classMap = {"PollingConnection": "Net", "Dialogs": "Widgets", "F.API.APIConnection": "Net", "F.API.Data": "API", "F.APIUtils": "API", "F.String": "Utils", "F.Net": "Utils", "F.API.Archive": "Net", "F.XML": "Utils", "ClipBoard": "Widgets", "F.Object": "Utils", "F.Array": "Utils", "AjaxConnection": "Net", "F.": "Utils"};

YAHOO.env.resolveClass = function(className) {
    var a=className.split('.'), ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
