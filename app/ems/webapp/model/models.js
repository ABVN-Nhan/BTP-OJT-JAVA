sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime information for the device the UI5 app is running on as a JSONModel.
         * @returns {sap.ui.model.json.JSONModel} The device model.
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        /**
         * Creates the employee model for managing employee data
         * @returns {sap.ui.model.json.JSONModel} The employee model
         */
        createEmployeeModel: function () {
            var oModel = new JSONModel({
                employees: [],
                filteredEmployees: []
            });
            return oModel;
        },

        /**
         * Creates the department model for department filter
         * @returns {sap.ui.model.json.JSONModel} The department model
         */
        createDepartmentModel: function () {
            var oModel = new JSONModel([]);
            return oModel;
        },

        /**
         * Creates the role model for role filter
         * @returns {sap.ui.model.json.JSONModel} The role model
         */
        createRoleModel: function () {
            var oModel = new JSONModel([]);
            return oModel;
        },

        /**
         * Creates the user model for user information and permissions
         * @returns {sap.ui.model.json.JSONModel} The user model
         */
        createUserModel: function () {
            var oModel = new JSONModel({
                userId: "",
                isAuthenticated: false,
                loading: true,
                roles: {
                    admin: false,
                    viewer: false
                },
                isAdmin: false
            });
            return oModel;
        },

        /**
         * Creates the view model for managing view states
         * @returns {sap.ui.model.json.JSONModel} The view model
         */
        createViewModel: function () {
            var oModel = new JSONModel({
                editMode: false,
                originalEmployee: null,
                showCalculateButton: false
            });
            return oModel;
        },

        /**
         * Creates the new employee model for add employee dialog
         * @returns {sap.ui.model.json.JSONModel} The new employee model
         */
        createNewEmployeeModel: function () {
            var oModel = new JSONModel({
                firstName: "",
                lastName: "",
                email: "",
                dateOfBirth: null,
                gender: "",
                hireDate: new Date(),
                department_ID: "",
                role_ID: "",
                salary: ""
            });
            return oModel;
        }
    };
});