sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "ems/model/formatter"
], (Controller, MessageToast, History, JSONModel, MessageBox, BusyDialog, formatter) => {
    "use strict";

    return Controller.extend("ems.controller.EmployeeList", {
        formatter: formatter,
        onInit() {
            this._initializeModels();
            this._loadInitialData();

            // Attach to route pattern matched for refresh on navigation
            this.getOwnerComponent().getRouter().getRoute("employeeList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            // Only refresh if explicitly requested via route parameter
            var oArgs = oEvent.getParameter("arguments");
            var bForceRefresh = oArgs && oArgs.refresh === "true";
            
            if (bForceRefresh) {
                var oViewModel = this.getView().getModel("viewModel");
                if (oViewModel) {
                    oViewModel.setProperty("/busy", true);
                }

                this._loadEmployees().then(function() {
                    // Clear the refresh parameter from URL after refresh
                    this._clearRefreshParameter();
                }.bind(this)).catch(function(oError) {
                    console.error("Error refreshing data on route match:", oError);
                }).finally(function() {
                    if (oViewModel) {
                        oViewModel.setProperty("/busy", false);
                    }
                }.bind(this));
            }
            
            // Always ensure filters are applied to current data
            this._applyCurrentFilters();
        },

        _clearRefreshParameter: function() {
            // Navigate to clean URL without refresh parameter
            var oRouter = this.getOwnerComponent().getRouter();
            if (oRouter) {
                oRouter.navTo("employeeList", {}, true /* replace history */);
            }
        },

        _applyCurrentFilters: function() {
            // Reapply any active filters to the current data
            var sDepartmentId = this.byId("departmentFilter").getSelectedKey();
            var sRoleId = this.byId("roleFilter").getSelectedKey();
            
            if (sDepartmentId || sRoleId) {
                this.onFilterChange();
            }
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
                    isAdmin: oData.roles.admin === true && oData.roles.viewer !== true
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
            var oViewModel = this.getView().getModel("viewModel");
            if (oViewModel) {
                oViewModel.setProperty("/busy", true);
            }

            this._loadEmployees().then(function() {
                var oResourceBundle = this.getResourceBundle();
                if (oResourceBundle) {
                    MessageToast.show(oResourceBundle.getText("dataRefreshed"));
                }
            }.bind(this)).catch(function(oError) {
                console.error("Error refreshing data:", oError);
                var oResourceBundle = this.getResourceBundle();
                if (oResourceBundle) {
                    MessageToast.show(oResourceBundle.getText("errorRefreshingData"));
                }
            }).finally(function() {
                if (oViewModel) {
                    oViewModel.setProperty("/busy", false);
                }
            }.bind(this));
        },

        onAddEmployee: function () {
            this._openAddEmployeeDialog();
        },

        _openAddEmployeeDialog: function () {
            var oView = this.getView();
            var today = this._formatDateForOData(new Date());

            // Get the existing new employee model from component and reset it
            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");

            // Reset the model data
            oNewEmployeeModel.setData({
                firstName: "",
                lastName: "",
                email: "",
                dateOfBirth: null,
                gender: "",
                hireDate: today,
                department_ID: "",
                role_ID: "",
                salary: ""
            });

            if (!this._oAddEmployeeDialog) {
                sap.ui.core.Fragment.load({
                    name: "ems.view.fragment.AddEmployeeDialog",
                    type: "XML",
                    controller: this
                }).then(function (oDialog) {
                    this._oAddEmployeeDialog = oDialog;
                    this.getView().addDependent(this._oAddEmployeeDialog);

                    // Set initial button states
                    setTimeout(function () {
                        this._updateCreateButtonState();
                    }.bind(this), 100);

                    // Open the dialog
                    this._oAddEmployeeDialog.open();
                }.bind(this)).catch(function (oError) {
                    console.error("Error loading fragment:", oError);
                    MessageBox.error("Failed to load Add Employee dialog");
                });
            } else {
                // Set initial button states
                setTimeout(function () {
                    this._updateCreateButtonState();
                }.bind(this), 100);

                // Open the dialog
                this._oAddEmployeeDialog.open();
            }
        },

        onNewEmployeeFieldChange: function (oEvent) {
            // Clear validation state when user changes field
            var oSource = oEvent.getSource();
            if (oSource.setValueState) {
                oSource.setValueState(sap.ui.core.ValueState.None);
                oSource.setValueStateText("");
            }

            // For ComboBox, close the dropdown after selection
            if (oSource.getMetadata().getName() === "sap.m.ComboBox") {
                setTimeout(function() {
                    oSource.close();
                }, 100);
            }

            // Update button enablement
            this._updateCreateButtonState();

            // Update years of experience when hire date changes
            var sId = oSource.getId();
            if (sId && sId.includes("newHireDatePicker")) {
                this._updateYearsOfExperience();
            }
        },

        onNewEmployeeRoleChange: function (oEvent) {
            // Handle role change
            this.onNewEmployeeFieldChange(oEvent);
            
            // Clear salary when role changes
            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            oNewEmployeeModel.setProperty("/salary", "");
            
            // Close the ComboBox dropdown
            var oSource = oEvent.getSource();
            setTimeout(function() {
                oSource.close();
            }, 100);
        },

        _updateCreateButtonState: function () {
            if (!this._oAddEmployeeDialog) return;

            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            var oEmployee = oNewEmployeeModel.getData();

            var bEnabled = oEmployee.firstName && oEmployee.lastName &&
                oEmployee.email && oEmployee.dateOfBirth &&
                oEmployee.gender && oEmployee.hireDate &&
                oEmployee.department_ID && oEmployee.role_ID;

            var oCreateButton = sap.ui.getCore().byId("createEmployeeButton");
            if (oCreateButton) {
                oCreateButton.setEnabled(bEnabled);
            }

            // Update calculate salary button
            var bCalculateEnabled = oEmployee.role_ID && oEmployee.hireDate;
            var oCalculateButton = sap.ui.getCore().byId("calculateNewSalaryButton");
            if (oCalculateButton) {
                oCalculateButton.setEnabled(bCalculateEnabled);
            }
        },

        _updateYearsOfExperience: function () {
            // Force refresh of the years of experience display
            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            if (oNewEmployeeModel) {
                var sHireDate = oNewEmployeeModel.getProperty("/hireDate");
                // Trigger model refresh to update formatter
                oNewEmployeeModel.refresh(true);
            }
        },

        onCalculateNewEmployeeSalary: function () {
            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            var sRoleId = oNewEmployeeModel.getProperty("/role_ID");
            var sHireDate = oNewEmployeeModel.getProperty("/hireDate");

            if (!sRoleId || !sHireDate) {
                MessageBox.error(this.getResourceBundle().getText("roleAndHireDateRequired"));
                return;
            }

            var oODataModel = this.getOwnerComponent().getModel();
            var oBusyDialog = new BusyDialog({
                text: this.getResourceBundle().getText("calculatingSalary")
            });

            oBusyDialog.open();

            try {
                // Format the hire date properly
                var sFormattedHireDate = this._formatDateForOData(sHireDate);

                // Create function import binding
                var sPath = `/calculateSalary(roleId=${sRoleId},hireDate=${sFormattedHireDate})`;
                var oBinding = oODataModel.bindContext(sPath);

                oBinding.requestObject().then(function (oResult) {
                    var fCalculatedSalary = oResult.value || oResult;

                    // Update salary in the model
                    oNewEmployeeModel.setProperty("/salary", fCalculatedSalary);
                    oBusyDialog.close();
                    MessageToast.show(this.getResourceBundle().getText("salaryCalculated") + ": " + formatter.formatSalary(fCalculatedSalary));

                }.bind(this)).catch(function (oError) {
                    console.error("Error calculating salary:", oError);
                    oBusyDialog.close();
                    MessageBox.error(this.getResourceBundle().getText("errorCalculatingSalary"));
                }.bind(this));

            } catch (oError) {
                console.error("Error in calculate salary:", oError);
                oBusyDialog.close();
                MessageBox.error(this.getResourceBundle().getText("errorCalculatingSalary"));
            }
        },

        _formatDateForOData: function (vDate) {
            if (!vDate) return null;

            var oDate = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(oDate.getTime())) return null;

            // Format as YYYY-MM-DD for OData
            var sYear = oDate.getFullYear();
            var sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
            var sDay = String(oDate.getDate()).padStart(2, '0');

            return `${sYear}-${sMonth}-${sDay}`;
        },

        onSaveNewEmployee: function () {
            if (!this._validateNewEmployeeData()) {
                return;
            }

            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            var oEmployeeData = oNewEmployeeModel.getData();

            // Show confirmation dialog
            MessageBox.confirm(
                this.getResourceBundle().getText("confirmCreateEmployee"),
                {
                    title: this.getResourceBundle().getText("confirmCreateTitle"),
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.YES) {
                            this._createNewEmployee(oEmployeeData);
                        }
                    }.bind(this)
                }
            );
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        _validateNewEmployeeData: function () {
            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            var oEmployee = oNewEmployeeModel.getData();
            var aErrors = [];

            // Clear all previous error states
            this._clearAllFieldErrors();

            // Validate required fields
            if (!oEmployee.firstName || oEmployee.firstName.trim() === "") {
                aErrors.push(this.getResourceBundle().getText("firstNameRequired"));
                this._setFieldError("newFirstNameInput", this.getResourceBundle().getText("firstNameRequired"));
            }

            if (!oEmployee.lastName || oEmployee.lastName.trim() === "") {
                aErrors.push(this.getResourceBundle().getText("lastNameRequired"));
                this._setFieldError("newLastNameInput", this.getResourceBundle().getText("lastNameRequired"));
            }

            if (!oEmployee.email || oEmployee.email.trim() === "") {
                aErrors.push(this.getResourceBundle().getText("emailRequired"));
                this._setFieldError("newEmailInput", this.getResourceBundle().getText("emailRequired"));
            } else {
                // Validate email format
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(oEmployee.email)) {
                    aErrors.push(this.getResourceBundle().getText("emailInvalid"));
                    this._setFieldError("newEmailInput", this.getResourceBundle().getText("emailInvalid"));
                }
            }

            if (!oEmployee.dateOfBirth) {
                aErrors.push(this.getResourceBundle().getText("dobRequired"));
                this._setFieldError("newDateOfBirthPicker", this.getResourceBundle().getText("dobRequired"));
            } else {
                // Validate date of birth is not in the future
                var today = new Date();
                var dob = new Date(oEmployee.dateOfBirth);
                if (dob > today) {
                    aErrors.push(this.getResourceBundle().getText("dobFuture"));
                    this._setFieldError("newDateOfBirthPicker", this.getResourceBundle().getText("dobFuture"));
                }
            }

            if (!oEmployee.gender) {
                aErrors.push(this.getResourceBundle().getText("genderRequired"));
                this._setFieldError("newGenderComboBox", this.getResourceBundle().getText("genderRequired"));
            }

            if (!oEmployee.hireDate) {
                aErrors.push(this.getResourceBundle().getText("hireDateRequired"));
                this._setFieldError("newHireDatePicker", this.getResourceBundle().getText("hireDateRequired"));
            }

            if (!oEmployee.department_ID) {
                aErrors.push(this.getResourceBundle().getText("departmentRequired"));
                this._setFieldError("newDepartmentComboBox", this.getResourceBundle().getText("departmentRequired"));
            }

            if (!oEmployee.role_ID) {
                aErrors.push(this.getResourceBundle().getText("roleRequired"));
                this._setFieldError("newRoleComboBox", this.getResourceBundle().getText("roleRequired"));
            }

            return aErrors.length === 0;
        },

        _clearAllFieldErrors: function () {
            var aFieldIds = [
                "newFirstNameInput", "newLastNameInput", "newEmailInput",
                "newDateOfBirthPicker", "newGenderComboBox", "newHireDatePicker",
                "newDepartmentComboBox", "newRoleComboBox"
            ];

            aFieldIds.forEach(function (sFieldId) {
                var oField = sap.ui.getCore().byId(sFieldId);
                if (oField && oField.setValueState) {
                    oField.setValueState(sap.ui.core.ValueState.None);
                    oField.setValueStateText("");
                }
            });
        },

        _setFieldError: function (sFieldId, sErrorText) {
            var oField = sap.ui.getCore().byId(sFieldId);
            if (oField && oField.setValueState) {
                oField.setValueState(sap.ui.core.ValueState.Error);
                oField.setValueStateText(sErrorText);
            }
        },

        _createNewEmployee: function (oEmployeeData) {
            var oODataModel = this.getOwnerComponent().getModel();
            var oBusyDialog = new BusyDialog({
                text: this.getResourceBundle().getText("creatingEmployee")
            });

            oBusyDialog.open();

            try {
                // Prepare the employee data for creation
                var oNewEmployee = {
                    firstName: oEmployeeData.firstName.trim(),
                    lastName: oEmployeeData.lastName.trim(),
                    email: oEmployeeData.email.trim().toLowerCase(),
                    dateOfBirth: this._formatDateForOData(oEmployeeData.dateOfBirth),
                    gender: oEmployeeData.gender,
                    hireDate: this._formatDateForOData(oEmployeeData.hireDate),
                    salary: oEmployeeData.salary.toString() || "0",
                    department_ID: oEmployeeData.department_ID,
                    role_ID: oEmployeeData.role_ID
                };

                // Create a list binding and add the new employee
                var oListBinding = oODataModel.bindList("/Employees");
                var oNewContext = oListBinding.create(oNewEmployee);

                // Submit the batch
                oODataModel.submitBatch("$auto").then(function () {
                    MessageToast.show(this.getResourceBundle().getText("employeeCreated"));

                    // Close dialog
                    this._oAddEmployeeDialog.close();

                    // Refresh employee list
                    this._loadEmployees();

                }.bind(this)).catch(function (oError) {
                    console.error("Error creating employee:", oError);
                    MessageBox.error(this.getResourceBundle().getText("errorCreatingEmployee"));
                }.bind(this)).finally(function () {
                    oBusyDialog.close();
                }.bind(this));

            } catch (oError) {
                console.error("Error in create operation:", oError);
                MessageBox.error(this.getResourceBundle().getText("errorCreatingEmployee"));
                oBusyDialog.close();
            }
        },

        onCancelNewEmployee: function () {
            var oNewEmployeeModel = this.getOwnerComponent().getModel("newEmployeeModel");
            var oEmployee = oNewEmployeeModel.getData();

            // Check if user has entered any data
            var bHasData = oEmployee.firstName || oEmployee.lastName || oEmployee.email ||
                oEmployee.dateOfBirth || oEmployee.gender || oEmployee.department_ID ||
                oEmployee.role_ID;

            if (bHasData) {
                MessageBox.confirm(
                    this.getResourceBundle().getText("confirmCancelCreate"),
                    {
                        title: this.getResourceBundle().getText("confirmCancelTitle"),
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.NO,
                        onClose: function (oAction) {
                            if (oAction === MessageBox.Action.YES) {
                                this._oAddEmployeeDialog.close();
                            }
                        }.bind(this)
                    }
                );
            } else {
                this._oAddEmployeeDialog.close();
            }
        },
        onNavigateToDetails: function (oEvent) {
            // Get the employee ID from the event source
            var oSource = oEvent.getSource();
            var oBindingContext = oSource.getBindingContext("employeeModel");

            if (!oBindingContext) {
                // If no binding context, try to get it from the list item
                var oListItem = oEvent.getParameter("listItem") || oSource.getParent();
                if (oListItem) {
                    oBindingContext = oListItem.getBindingContext("employeeModel");
                }
            }

            if (oBindingContext) {
                var oEmployee = oBindingContext.getObject();
                var sEmployeeId = oEmployee.ID;

                // Navigate to employee detail page
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("employeeDetail", {
                    employeeId: sEmployeeId
                });
            } else {
                console.error("No employee data found for navigation");
                MessageToast.show("Unable to navigate to employee details");
            }
        },
    });
});