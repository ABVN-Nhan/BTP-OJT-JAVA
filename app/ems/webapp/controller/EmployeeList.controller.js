sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], (Controller, MessageToast, History) => {
    "use strict";

    return Controller.extend("ems.controller.EmployeeList", {
        onInit() {
            this._initializeModels();
            this._loadInitialData();
        },

        _initializeModels: function () {
            // Models are already created in Component.js, just get references
            this.oEmployeeModel = this.getOwnerComponent().getModel("employeeModel");
            this.oDepartmentModel = this.getOwnerComponent().getModel("departmentModel");
            this.oRoleModel = this.getOwnerComponent().getModel("roleModel");
            this.oUserModel = this.getOwnerComponent().getModel("user");
        },

        _loadInitialData: function () {
            this._loadUserInfo();
            this._loadDepartments();
            this._loadRoles();
            this._loadEmployees();
        },

        _loadUserInfo: function () {
            var oDataModel = this.getOwnerComponent().getModel();
            var oContext = oDataModel.bindContext("/getCurrentUserInfo()");
            oContext.requestObject().then((oData) => {
                this.oUserModel.setData({
                    userId: oData.userId,
                    isAuthenticated: oData.isAuthenticated,
                    roles: oData.roles,
                    isAdmin: oData.roles.admin
                });
            }).catch((oError) => {
                console.error("Error loading user info:", oError);
                MessageToast.show(this.getResourceBundle().getText("errorLoadingUserInfo"));
            });
        },

        _loadDepartments: function () {
            var oDataModel = this.getOwnerComponent().getModel();

            var oListBinding = oDataModel.bindList("/Departments");
            oListBinding.requestContexts().then(function (aContexts) {
                var aDepartments = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
                aDepartments.unshift({
                    ID: "",
                    name: "All"
                });
                this.oDepartmentModel.setData(aDepartments);

            }.bind(this)).catch(function (oError) {
                console.error("Error loading departments:", oError);
                MessageToast.show(this.getResourceBundle().getText("errorLoadingDepartments"));
            });
        },

        _loadRoles: function () {
            var oDataModel = this.getOwnerComponent().getModel();

            var oListBinding = oDataModel.bindList("/Roles");
            oListBinding.requestContexts().then(function (aContexts) {
                var aRoles = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
                aRoles.unshift({
                    ID: "",
                    name: "All"
                });
                this.oRoleModel.setData(aRoles);
            }.bind(this)).catch((oError) => {
                console.error("Error loading roles:", oError);
                MessageToast.show(this.getResourceBundle().getText("errorLoadingRoles"));
            });
        },

        _loadEmployees: function () {
            var oDataModel = this.getOwnerComponent().getModel();

            var oListBinding = oDataModel.bindList("/Employees", undefined, undefined, undefined, {
                $expand: "department,role"
            });

            oListBinding.requestContexts().then(function (aContexts) {
                var aEmployees = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
                this.oEmployeeModel.setProperty("/employees", aEmployees);
                this.oEmployeeModel.setProperty("/filteredEmployees", aEmployees);
            }.bind(this)).catch((oError) => {
                console.error("Error loading employees:", oError);
                MessageToast.show(this.getResourceBundle().getText("errorLoadingEmployees"));
            });
},

    onFilterChange: function () {
        var sDepartmentId = this.byId("departmentFilter").getSelectedKey();
        var sRoleId = this.byId("roleFilter").getSelectedKey();
        var aEmployees = this.oEmployeeModel.getProperty("/employees");
        var aFilteredEmployees = aEmployees.filter(function (oEmployee) {
            var bDepartmentMatch = !sDepartmentId || oEmployee.department_ID === sDepartmentId;
            var bRoleMatch = !sRoleId || oEmployee.role_ID === sRoleId;
            return bDepartmentMatch && bRoleMatch;
        });

        this.oEmployeeModel.setProperty("/filteredEmployees", aFilteredEmployees);
    },

    onClearFilters: function () {
        this.byId("departmentFilter").setSelectedKey("");
        this.byId("roleFilter").setSelectedKey("");
        var aEmployees = this.oEmployeeModel.getProperty("/employees");
        this.oEmployeeModel.setProperty("/filteredEmployees", aEmployees);
    },

    onRefreshData: function () {
        this._loadEmployees();
        MessageToast.show(this.getResourceBundle().getText("dataRefreshed"));
    },

    onAddEmployee: function () {
        // Navigate to employee creation view
        this.getRouter().navTo("employeeCreate");
    },

    onNavigateToDetails: function (oEvent) {
        var oBindingContext = oEvent.getSource().getBindingContext("employeeModel");
        var sEmployeeId = oBindingContext.getProperty("ID");

        this.getRouter().navTo("employeeDetail", {
            employeeId: sEmployeeId
        });
    },

    getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    },

    getRouter: function () {
        return this.getOwnerComponent().getRouter();
    }
    });
});