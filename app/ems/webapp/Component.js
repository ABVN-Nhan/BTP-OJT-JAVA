sap.ui.define([
    "sap/ui/core/UIComponent",
    "ems/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("ems.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");
            
            // set the employee model
            this.setModel(models.createEmployeeModel(), "employeeModel");
            
            // set the department model
            this.setModel(models.createDepartmentModel(), "departmentModel");
            
            // set the role model
            this.setModel(models.createRoleModel(), "roleModel");
            
            // set the user model
            this.setModel(models.createUserModel(), "user");
            
            // set the view model
            this.setModel(models.createViewModel(), "viewModel");
            
            // set the new employee model
            this.setModel(models.createNewEmployeeModel(), "newEmployeeModel");
        }
    });
});