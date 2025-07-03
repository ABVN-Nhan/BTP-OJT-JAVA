sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("ems.controller.NotFound", {
        
        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("employeeList", {}, true);
            }
        },

        onNavToHome: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("employeeList", {}, true);
        }
    });
});