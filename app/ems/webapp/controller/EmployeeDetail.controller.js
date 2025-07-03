sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/BusyDialog",
    "sap/ui/core/routing/History",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "ems/model/formatter"
], function (Controller, JSONModel, MessageToast, MessageBox, BusyDialog, History, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("ems.controller.EmployeeDetail", {

        formatter: formatter,

        onInit: function () {
            // Initialize view model
            this._initializeViewModel();

            // Clear employee model on init
            this._clearEmployeeModel();

            // Load master data
            this._loadMasterData();

            // Attach to route
            this._attachToRoute();
        },

        _attachToRoute: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found");
                return;
            }

            var oRouter = oComponent.getRouter();
            if (!oRouter) {
                console.error("Router not found");
                return;
            }

            var oRoute = oRouter.getRoute("employeeDetail");
            if (oRoute) {
                oRoute.attachPatternMatched(this._onRouteMatched, this);
            } else {
                console.error("Employee detail route not found");
            }
        },

        _initializeViewModel: function () {
            var oViewModel = new JSONModel({
                editMode: false,
                busy: false,
                originalEmployee: null,
                showCalculateButton: false
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Get user model from component
            this._setupUserModel();
        },

        _setupUserModel: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found");
                return;
            }

            var oUserModel = oComponent.getModel("user");
            if (!oUserModel) {
                console.error("User model not found");
                return;
            }

            this.getView().setModel(oUserModel, "user");

            // Listen for user model changes
            oUserModel.attachPropertyChange(this._onUserModelChange.bind(this));

            // If user is already loaded, update UI
            var bLoading = oUserModel.getProperty("/loading");
            if (!bLoading) {
                this._onUserLoaded();
            }
        },

        _onUserModelChange: function (oEvent) {
            if (!oEvent) return;

            var sPath = oEvent.getParameter("path");
            var vValue = oEvent.getParameter("value");
            
            if (sPath === "/loading" && !vValue) {
                this._onUserLoaded();
            }
        },

        _onUserLoaded: function () {
            var oUserModel = this.getView().getModel("user");
            var oViewModel = this.getView().getModel("viewModel");
            
            if (!oUserModel || !oViewModel) {
                console.error("Required models not found");
                return;
            }

            var bIsAdmin = oUserModel.getProperty("/isAdmin");
            oViewModel.setProperty("/showCalculateButton", bIsAdmin);
        },

        _loadMasterData: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found");
                return;
            }

            var oODataModel = oComponent.getModel();
            if (!oODataModel) {
                console.error("OData model not found");
                return;
            }

            // Load departments and roles
            this._loadDepartments(oODataModel);
            this._loadRoles(oODataModel);
        },

        _loadDepartments: function (oODataModel) {
            if (!oODataModel) {
                console.error("OData model is required for loading departments");
                return;
            }

            try {
                var oDepartmentModel = new JSONModel();
                var oListBinding = oODataModel.bindList("/Departments");

                this._requestDepartmentContexts(oListBinding, oDepartmentModel);
            } catch (error) {
                console.error("Error binding departments:", error);
                this._setEmptyDepartmentModel();
            }
        },

        _requestDepartmentContexts: function (oListBinding, oDepartmentModel) {
            if (!oListBinding || !oDepartmentModel) {
                console.error("Required parameters missing for department loading");
                return;
            }

            oListBinding.requestContexts(0, 100).then(function (aContexts) {
                this._processDepartmentContexts(aContexts, oDepartmentModel);
            }.bind(this)).catch(function (oError) {
                console.error("Error loading departments:", oError);
                this._setEmptyDepartmentModel();
                this._showLoadingError("errorLoadingDepartments");
            }.bind(this));
        },

        _processDepartmentContexts: function (aContexts, oDepartmentModel) {
            if (!aContexts || !oDepartmentModel) {
                console.error("Invalid parameters for processing department contexts");
                return;
            }

            var aDepartments = aContexts.map(function (oContext) {
                return oContext.getObject();
            });

            oDepartmentModel.setData(aDepartments);
            this.getView().setModel(oDepartmentModel, "departmentModel");
        },

        _setEmptyDepartmentModel: function () {
            var oDepartmentModel = new JSONModel();
            oDepartmentModel.setData([]);
            this.getView().setModel(oDepartmentModel, "departmentModel");
        },

        _loadRoles: function (oODataModel) {
            if (!oODataModel) {
                console.error("OData model is required for loading roles");
                return;
            }

            try {
                var oRoleModel = new JSONModel();
                var oListBinding = oODataModel.bindList("/Roles");

                this._requestRoleContexts(oListBinding, oRoleModel);
            } catch (error) {
                console.error("Error binding roles:", error);
                this._setEmptyRoleModel();
            }
        },

        _requestRoleContexts: function (oListBinding, oRoleModel) {
            if (!oListBinding || !oRoleModel) {
                console.error("Required parameters missing for role loading");
                return;
            }

            oListBinding.requestContexts(0, 100).then(function (aContexts) {
                this._processRoleContexts(aContexts, oRoleModel);
            }.bind(this)).catch(function (oError) {
                console.error("Error loading roles:", oError);
                this._setEmptyRoleModel();
                this._showLoadingError("errorLoadingRoles");
            }.bind(this));
        },

        _processRoleContexts: function (aContexts, oRoleModel) {
            if (!aContexts || !oRoleModel) {
                console.error("Invalid parameters for processing role contexts");
                return;
            }

            var aRoles = aContexts.map(function (oContext) {
                return oContext.getObject();
            });

            oRoleModel.setData(aRoles);
            this.getView().setModel(oRoleModel, "roleModel");
        },

        _setEmptyRoleModel: function () {
            var oRoleModel = new JSONModel();
            oRoleModel.setData([]);
            this.getView().setModel(oRoleModel, "roleModel");
        },

        _showLoadingError: function (sMessageKey) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle && sMessageKey) {
                var sMessage = oResourceBundle.getText(sMessageKey);
                MessageToast.show(sMessage);
            }
        },

        _onRouteMatched: function (oEvent) {
            if (!oEvent) {
                console.error("Route event is missing");
                return;
            }

            var oParameters = oEvent.getParameter("arguments");
            if (!oParameters) {
                console.error("Route parameters are missing");
                return;
            }

            var sEmployeeId = oParameters.employeeId;
            if (sEmployeeId) {
                // Clear existing employee data first to prevent old data from showing
                this._clearEmployeeModel();
                this._loadEmployeeData(sEmployeeId);
            } else {
                console.error("Employee ID not found in route parameters");
            }
        },

        _clearEmployeeModel: function () {
            // Clear the employee model to prevent showing old data
            var oEmployeeModel = this.getView().getModel("employeeModel");
            if (oEmployeeModel) {
                oEmployeeModel.setData({});
            } else {
                // Create empty model if it doesn't exist
                var oEmptyModel = new JSONModel({});
                this.getView().setModel(oEmptyModel, "employeeModel");
            }

            // Reset view model state
            var oViewModel = this.getView().getModel("viewModel");
            if (oViewModel) {
                oViewModel.setProperty("/editMode", false);
                oViewModel.setProperty("/originalEmployee", null);
            }
        },

        _loadEmployeeData: function (sEmployeeId) {
            if (!sEmployeeId) {
                console.error("Employee ID is required");
                return;
            }

            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found");
                return;
            }

            var oODataModel = oComponent.getModel();
            if (!oODataModel) {
                console.error("OData model not found");
                return;
            }

            this._requestEmployeeData(oODataModel, sEmployeeId);
        },

        _requestEmployeeData: function (oODataModel, sEmployeeId) {
            var oEmployeeModel = new JSONModel();
            var oBusyDialog = new BusyDialog();
            
            oEmployeeModel.setData([]);
            oBusyDialog.open();

            try {
                var sPath = "/Employees(" + sEmployeeId + ")";
                var oContext = oODataModel.bindContext(sPath, undefined, {
                    $expand: "role,department"
                });

                this._processEmployeeRequest(oContext, oEmployeeModel, oBusyDialog);
            } catch (error) {
                console.error("Error in _requestEmployeeData:", error);
                oBusyDialog.close();
            }
        },

        _processEmployeeRequest: function (oContext, oEmployeeModel, oBusyDialog) {
            if (!oContext || !oEmployeeModel || !oBusyDialog) {
                console.error("Required parameters missing for employee request processing");
                if (oBusyDialog) oBusyDialog.close();
                return;
            }

            oContext.requestObject().then(function (oEmployee) {
                this._handleEmployeeData(oEmployee, oEmployeeModel, oBusyDialog);
            }.bind(this)).catch(function (oError) {
                console.error("Error loading employee:", oError);
                this._showEmployeeError();
                oBusyDialog.close();
            }.bind(this));
        },

        _handleEmployeeData: function (oEmployee, oEmployeeModel, oBusyDialog) {
            if (!oBusyDialog) {
                console.error("Busy dialog is required");
                return;
            }

            if (oEmployee && oEmployeeModel) {
                this._setEmployeeData(oEmployee, oEmployeeModel);
            } else {
                this._showEmployeeNotFound();
            }
            
            oBusyDialog.close();
        },

        _setEmployeeData: function (oEmployee, oEmployeeModel) {
            if (!oEmployee || !oEmployeeModel) {
                console.error("Employee data and model are required");
                return;
            }

            // Store original data for cancel functionality
            var oViewModel = this.getView().getModel("viewModel");
            if (oViewModel) {
                var oOriginalData = JSON.parse(JSON.stringify(oEmployee));
                oViewModel.setProperty("/originalEmployee", oOriginalData);
            }

            oEmployeeModel.setData(oEmployee);
            this.getView().setModel(oEmployeeModel, "employeeModel");
        },

        _showEmployeeError: function () {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("errorLoadingEmployee");
                MessageToast.show(sMessage);
            }
        },

        _showEmployeeNotFound: function () {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("employeeNotFound");
                MessageBox.error(sMessage);
            }
            this.onNavBack();
        },

        onNavBack: function () {
            var oViewModel = this.getView().getModel("viewModel");
            if (!oViewModel) {
                this._navigateBack();
                return;
            }

            var bEditMode = oViewModel.getProperty("/editMode");
            var bHasUnsavedChanges = this._hasUnsavedChanges();

            if (bEditMode && bHasUnsavedChanges) {
                this._showUnsavedChangesDialog();
            } else {
                this._navigateBack();
            }
        },

        _showUnsavedChangesDialog: function () {
            var oResourceBundle = this.getResourceBundle();
            if (!oResourceBundle) {
                this._navigateBack();
                return;
            }

            var sMessage = oResourceBundle.getText("unsavedChangesMessage");
            var sTitle = oResourceBundle.getText("unsavedChangesTitle");

            MessageBox.confirm(sMessage, {
                title: sTitle,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.NO,
                onClose: this._handleUnsavedChangesResponse.bind(this)
            });
        },

        _handleUnsavedChangesResponse: function (oAction) {
            if (oAction === MessageBox.Action.YES) {
                this._toggleEditMode(false);
                this._navigateBack();
            }
        },

        _navigateBack: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found for navigation");
                return;
            }

            var oRouter = oComponent.getRouter();
            if (!oRouter) {
                console.error("Router not found for navigation");
                return;
            }

            oRouter.navTo("employeeList", {}, true);
        },

        onEditEmployee: function () {
            this._toggleEditMode(true);
        },

        onSaveEmployee: function () {
            var oResourceBundle = this.getResourceBundle();
            if (!oResourceBundle) {
                console.error("Resource bundle not found");
                return;
            }

            var sMessage = oResourceBundle.getText("confirmSaveMessage");
            var sTitle = oResourceBundle.getText("confirmSaveTitle");

            MessageBox.confirm(sMessage, {
                title: sTitle,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: this._handleSaveConfirmation.bind(this)
            });
        },

        _handleSaveConfirmation: function (oAction) {
            if (oAction === MessageBox.Action.YES) {
                var bIsValid = this._validateEmployeeData();
                if (bIsValid) {
                    this._saveEmployeeData();
                }
            }
        },

        onCancelEdit: function () {
            var bHasUnsavedChanges = this._hasUnsavedChanges();

            if (bHasUnsavedChanges) {
                this._showCancelConfirmation();
            } else {
                this._performCancel();
            }
        },

        _showCancelConfirmation: function () {
            var oResourceBundle = this.getResourceBundle();
            if (!oResourceBundle) {
                this._performCancel();
                return;
            }

            var sMessage = oResourceBundle.getText("confirmCancelMessage");
            var sTitle = oResourceBundle.getText("confirmCancelTitle");

            MessageBox.confirm(sMessage, {
                title: sTitle,
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.NO,
                onClose: this._handleCancelConfirmation.bind(this)
            });
        },

        _handleCancelConfirmation: function (oAction) {
            if (oAction === MessageBox.Action.YES) {
                this._performCancel();
            }
        },

        _performCancel: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oEmployeeModel = this.getView().getModel("employeeModel");
            
            if (!oViewModel || !oEmployeeModel) {
                console.error("Required models not found for cancel operation");
                return;
            }

            var oOriginalEmployee = oViewModel.getProperty("/originalEmployee");
            if (oOriginalEmployee) {
                var oRestoredData = JSON.parse(JSON.stringify(oOriginalEmployee));
                oEmployeeModel.setData(oRestoredData);
            }

            this._toggleEditMode(false);
            this._showCancelMessage();
        },

        _showCancelMessage: function () {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("changesCancelled");
                MessageToast.show(sMessage);
            }
        },

        _toggleEditMode: function (bEditMode) {
            var oViewModel = this.getView().getModel("viewModel");
            var oUserModel = this.getView().getModel("user");
            
            if (!oViewModel) {
                console.error("View model not found");
                return;
            }

            var bIsAdmin = oUserModel ? oUserModel.getProperty("/isAdmin") : false;
            oViewModel.setProperty("/editMode", bEditMode);

            if (bEditMode) {
                this._clearValidationStates();
            }

            this._toggleFormEditability(bEditMode);
            this._updateButtonVisibility(bEditMode, bIsAdmin);
        },

        _toggleFormEditability: function (bEditMode) {
            var oForm = this.byId("employeeForm");
            if (oForm) {
                oForm.setEditable(bEditMode);
            }

            this._toggleFieldEditability(bEditMode);
        },

        _toggleFieldEditability: function (bEditMode) {
            var aEditableFields = [
                "firstNameInput", "lastNameInput", "emailInput", "dobInput",
                "genderInput", "hireDateInput", "departmentInput", "roleInput"
            ];

            aEditableFields.forEach(function (sFieldId) {
                var oField = this.byId(sFieldId);
                if (oField) {
                    oField.setEditable(bEditMode);
                }
            }.bind(this));

            // Salary is always read-only
            var oSalaryInput = this.byId("salaryInput");
            if (oSalaryInput) {
                oSalaryInput.setEditable(false);
            }
        },

        _updateButtonVisibility: function (bEditMode, bIsAdmin) {
            var oEditButton = this.byId("editButton");
            var oSaveButton = this.byId("saveButton");
            var oCancelButton = this.byId("cancelButton");
            var oCalculateButton = this.byId("calculateSalaryButton");

            if (oEditButton) {
                oEditButton.setVisible(!bEditMode && bIsAdmin);
            }
            
            if (oSaveButton) {
                oSaveButton.setVisible(bEditMode && bIsAdmin);
            }
            
            if (oCancelButton) {
                oCancelButton.setVisible(bEditMode);
            }
            
            if (oCalculateButton) {
                oCalculateButton.setVisible(bEditMode && bIsAdmin);
            }

            this._updateDeleteButtonVisibility(bEditMode, bIsAdmin);
        },

        _updateDeleteButtonVisibility: function (bEditMode, bIsAdmin) {
            var oDeleteButton = this.byId("deleteButton");
            if (!oDeleteButton) {
                return;
            }

            var oEmployeeModel = this.getView().getModel("employeeModel");
            var oEmployee = oEmployeeModel ? oEmployeeModel.getData() : null;
            var bCanDelete = this._canDeleteEmployee(oEmployee);

            oDeleteButton.setVisible(!bEditMode && bCanDelete);
        },

        _validateEmployeeData: function () {
            var oEmployeeModel = this.getView().getModel("employeeModel");
            if (!oEmployeeModel) {
                console.error("Employee model not found for validation");
                return false;
            }

            var oEmployee = oEmployeeModel.getData();
            if (!oEmployee) {
                console.error("Employee data not found for validation");
                return false;
            }

            var aErrors = [];
            var today = this._formatDateForOData(new Date());

            console.log("Validating employee data:", oEmployee);
            
            this._validateRequiredFields(oEmployee, aErrors);
            this._validateDates(oEmployee, aErrors, today);
            this._validateSalary(oEmployee, aErrors);

            return this._showValidationResults(aErrors);
        },

        _validateRequiredFields: function (oEmployee, aErrors) {
            if (!oEmployee || !aErrors) {
                return;
            }

            var oResourceBundle = this.getResourceBundle();
            if (!oResourceBundle) {
                return;
            }

            // Validate text fields
            if (!oEmployee.firstName || oEmployee.firstName.trim() === "") {
                aErrors.push(oResourceBundle.getText("firstNameRequired"));
            }

            if (!oEmployee.lastName || oEmployee.lastName.trim() === "") {
                aErrors.push(oResourceBundle.getText("lastNameRequired"));
            }

            this._validateEmail(oEmployee, aErrors, oResourceBundle);
            this._validateGender(oEmployee, aErrors, oResourceBundle);
            this._validateDepartmentAndRole(oEmployee, aErrors, oResourceBundle);
        },

        _validateEmail: function (oEmployee, aErrors, oResourceBundle) {
            if (!oEmployee.email || oEmployee.email.trim() === "") {
                aErrors.push(oResourceBundle.getText("emailRequired"));
            } else {
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(oEmployee.email)) {
                    aErrors.push(oResourceBundle.getText("emailInvalid"));
                }
            }
        },

        _validateGender: function (oEmployee, aErrors, oResourceBundle) {
            if (!oEmployee.gender) {
                aErrors.push(oResourceBundle.getText("genderRequired"));
            }
        },

        _validateDepartmentAndRole: function (oEmployee, aErrors, oResourceBundle) {
            if (!oEmployee.department || !oEmployee.department.ID) {
                aErrors.push(oResourceBundle.getText("departmentRequired"));
            }

            if (!oEmployee.role || !oEmployee.role.ID) {
                aErrors.push(oResourceBundle.getText("roleRequired"));
            }
        },

        _validateDates: function (oEmployee, aErrors, today) {
            if (!oEmployee || !aErrors) {
                return;
            }

            var oResourceBundle = this.getResourceBundle();
            if (!oResourceBundle) {
                return;
            }

            this._validateDateOfBirth(oEmployee, aErrors, today, oResourceBundle);
            this._validateHireDate(oEmployee, aErrors, today, oResourceBundle);
        },

        _validateDateOfBirth: function (oEmployee, aErrors, today, oResourceBundle) {
            if (!oEmployee.dateOfBirth) {
                aErrors.push(oResourceBundle.getText("dobRequired"));
            } else if (oEmployee.dateOfBirth > today) {
                aErrors.push(oResourceBundle.getText("dobFuture"));
            }
        },

        _validateHireDate: function (oEmployee, aErrors, today, oResourceBundle) {
            if (!oEmployee.hireDate) {
                aErrors.push(oResourceBundle.getText("hireDateRequired"));
                return;
            }

            var hireDate = new Date(oEmployee.hireDate);

            if (hireDate > today) {
                aErrors.push(oResourceBundle.getText("hireDateFuture"));
            }

            // Validate hire date is after birth date
            if (oEmployee.dateOfBirth) {
                var birthDate = new Date(oEmployee.dateOfBirth);
                if (hireDate <= birthDate) {
                    aErrors.push(oResourceBundle.getText("hireDateAfterDOB"));
                }
            }
        },

        _validateSalary: function (oEmployee, aErrors) {
            if (!oEmployee || !aErrors) {
                return;
            }

            if (oEmployee.salary) {
                var fSalary = parseFloat(oEmployee.salary);
                if (isNaN(fSalary) || fSalary < 0) {
                    var oResourceBundle = this.getResourceBundle();
                    if (oResourceBundle) {
                        aErrors.push(oResourceBundle.getText("salaryInvalid"));
                    }
                }
            }
        },

        _showValidationResults: function (aErrors) {
            if (!aErrors) {
                return false;
            }

            if (aErrors.length > 0) {
                console.warn("Validation errors:", aErrors);
                var sErrorMessage = "• " + aErrors.join("\n• ");
                MessageBox.error(sErrorMessage);
                return false;
            }
            return true;
        },

        _saveEmployeeData: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found for saving");
                return;
            }

            var oODataModel = oComponent.getModel();
            if (!oODataModel) {
                console.error("OData model not found for saving");
                return;
            }

            var oEmployeeModel = this.getView().getModel("employeeModel");
            if (!oEmployeeModel) {
                console.error("Employee model not found for saving");
                return;
            }

            this._performSaveOperation(oODataModel, oEmployeeModel);
        },

        _performSaveOperation: function (oODataModel, oEmployeeModel) {
            var oEmployee = oEmployeeModel.getData();
            var oViewModel = this.getView().getModel("viewModel");
            
            var oResourceBundle = this.getResourceBundle();
            var sText = oResourceBundle ? oResourceBundle.getText("updatingEmployee") : "Updating...";
            var oBusyDialog = new BusyDialog({ text: sText });

            try {
                oBusyDialog.open();
                var oListBinding = oODataModel.bindList("/Employees");
                var oUpdateData = this._prepareUpdateData(oEmployee);

                this._executeUpdate(oListBinding, oEmployee, oUpdateData, oViewModel, oBusyDialog);
            } catch (oError) {
                console.error("Error in save operation:", oError);
                this._handleSaveError(oBusyDialog);
            }
        },

        _prepareUpdateData: function (oEmployee) {
            if (!oEmployee) {
                return {};
            }

            var oUpdateData = {
                firstName: oEmployee.firstName ? oEmployee.firstName.trim() : "",
                lastName: oEmployee.lastName ? oEmployee.lastName.trim() : "",
                email: oEmployee.email ? oEmployee.email.trim().toLowerCase() : "",
                dateOfBirth: this._formatDateForOData(oEmployee.dateOfBirth),
                gender: oEmployee.gender || "",
                hireDate: this._formatDateForOData(oEmployee.hireDate),
                salary: oEmployee.salary ? oEmployee.salary.toString() : "0"
            };

            this._addDepartmentAndRole(oEmployee, oUpdateData);
            return oUpdateData;
        },

        _addDepartmentAndRole: function (oEmployee, oUpdateData) {
            if (oEmployee.department && oEmployee.department.ID) {
                oUpdateData.department_ID = oEmployee.department.ID;
            }
            if (oEmployee.role && oEmployee.role.ID) {
                oUpdateData.role_ID = oEmployee.role.ID;
            }
        },

        _executeUpdate: function (oListBinding, oEmployee, oUpdateData, oViewModel, oBusyDialog) {
            var aFilters = [new Filter("ID", FilterOperator.EQ, oEmployee.ID)];
            oListBinding.filter(aFilters);

            oListBinding.requestContexts(0, 1).then(function (aContexts) {
                this._processUpdateContexts(aContexts, oUpdateData, oEmployee, oViewModel, oBusyDialog);
            }.bind(this)).catch(function (oError) {
                console.error("Error updating employee:", oError);
                this._handleSaveError(oBusyDialog);
            }.bind(this));
        },

        _processUpdateContexts: function (aContexts, oUpdateData, oEmployee, oViewModel, oBusyDialog) {
            if (aContexts.length === 0) {
                console.error("Employee not found for update");
                this._handleSaveError(oBusyDialog);
                return;
            }

            var oContext = aContexts[0];
            this._updateContextProperties(oContext, oUpdateData);
            this._submitUpdate(oEmployee, oUpdateData, oViewModel, oBusyDialog);
        },

        _updateContextProperties: function (oContext, oUpdateData) {
            if (!oContext || !oUpdateData) {
                return;
            }

            Object.keys(oUpdateData).forEach(function (sKey) {
                try {
                    console.log(`Setting ${sKey} to:`, oUpdateData[sKey], typeof oUpdateData[sKey]);
                    oContext.setProperty(sKey, oUpdateData[sKey]);
                } catch (error) {
                    console.warn("Could not set property " + sKey + ":", error);
                }
            });
        },

        _submitUpdate: function (oEmployee, oUpdateData, oViewModel, oBusyDialog) {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                this._handleSaveError(oBusyDialog);
                return;
            }

            var oODataModel = oComponent.getModel();
            if (!oODataModel) {
                this._handleSaveError(oBusyDialog);
                return;
            }

            oODataModel.submitBatch("$auto").then(function () {
                this._handleSaveSuccess(oEmployee, oUpdateData, oViewModel, oBusyDialog);
            }.bind(this)).catch(function (oError) {
                console.error("Error updating employee:", oError);
                this._handleSaveError(oBusyDialog);
            }.bind(this));
        },

        _handleSaveSuccess: function (oEmployee, oUpdateData, oViewModel, oBusyDialog) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("employeeUpdated");
                MessageToast.show(sMessage);
            }

            this._updateOriginalEmployee(oEmployee, oUpdateData, oViewModel);
            this._toggleEditMode(false);
            this._refreshEmployeeData(oEmployee.ID);
            
            oBusyDialog.close();
        },

        _updateOriginalEmployee: function (oEmployee, oUpdateData, oViewModel) {
            if (!oEmployee || !oUpdateData || !oViewModel) {
                return;
            }

            var oUpdatedEmployee = JSON.parse(JSON.stringify(oEmployee));
            oUpdatedEmployee.salary = oUpdateData.salary;
            oViewModel.setProperty("/originalEmployee", oUpdatedEmployee);
        },

        _refreshEmployeeData: function (sEmployeeId) {
            if (sEmployeeId) {
                this._loadEmployeeData(sEmployeeId);
            }
        },

        _handleSaveError: function (oBusyDialog) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("errorUpdatingEmployee");
                MessageBox.error(sMessage);
            }
            
            if (oBusyDialog) {
                oBusyDialog.close();
            }
        },

        _formatDateForOData: function (vDate) {
            if (!vDate) return null;

            var oDate = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(oDate.getTime())) return null;

            var sYear = oDate.getFullYear();
            var sMonth = String(oDate.getMonth() + 1).padStart(2, '0');
            var sDay = String(oDate.getDate()).padStart(2, '0');

            return `${sYear}-${sMonth}-${sDay}`;
        },

        onCalculateSalary: function () {
            var oUserModel = this.getView().getModel("user");
            if (!oUserModel) {
                console.error("User model not found");
                return;
            }

            var bIsAdmin = oUserModel.getProperty("/isAdmin");
            if (!bIsAdmin) {
                this._showPermissionError("noPermissionCalculateSalary");
                return;
            }

            this._performSalaryCalculation();
        },

        _performSalaryCalculation: function () {
            var oEmployeeModel = this.getView().getModel("employeeModel");
            if (!oEmployeeModel) {
                console.error("Employee model not found");
                return;
            }

            var oEmployee = oEmployeeModel.getData();
            if (!this._validateSalaryCalculationData(oEmployee)) {
                return;
            }

            this._executeSalaryCalculation(oEmployee, oEmployeeModel);
        },

        _validateSalaryCalculationData: function (oEmployee) {
            if (!oEmployee || !oEmployee.role || !oEmployee.role.ID || !oEmployee.hireDate) {
                var oResourceBundle = this.getResourceBundle();
                if (oResourceBundle) {
                    var sMessage = oResourceBundle.getText("roleAndHireDateRequired");
                    MessageBox.error(sMessage);
                }
                return false;
            }
            return true;
        },

        _executeSalaryCalculation: function (oEmployee, oEmployeeModel) {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found for salary calculation");
                return;
            }

            var oODataModel = oComponent.getModel();
            if (!oODataModel) {
                console.error("OData model not found for salary calculation");
                return;
            }

            var oResourceBundle = this.getResourceBundle();
            var sText = oResourceBundle ? oResourceBundle.getText("calculatingSalary") : "Calculating...";
            var oBusyDialog = new BusyDialog({ text: sText });

            this._requestSalaryCalculation(oODataModel, oEmployee, oEmployeeModel, oBusyDialog);
        },

        _requestSalaryCalculation: function (oODataModel, oEmployee, oEmployeeModel, oBusyDialog) {
            oBusyDialog.open();

            try {
                var sHireDate = this._formatDateForOData(oEmployee.hireDate);
                var sRoleId = oEmployee.role.ID;
                var sPath = `/calculateSalary(roleId=${sRoleId},hireDate=${sHireDate})`;
                var oBinding = oODataModel.bindContext(sPath);

                this._processSalaryCalculation(oBinding, oEmployeeModel, oBusyDialog);
            } catch (oError) {
                console.error("Error in calculate salary:", oError);
                this._handleCalculationError(oBusyDialog);
            }
        },

        _processSalaryCalculation: function (oBinding, oEmployeeModel, oBusyDialog) {
            oBinding.requestObject().then(function (oResult) {
                this._handleCalculationSuccess(oResult, oEmployeeModel, oBusyDialog);
            }.bind(this)).catch(function (oError) {
                console.error("Error calculating salary:", oError);
                this._handleCalculationError(oBusyDialog);
            }.bind(this));
        },

        _handleCalculationSuccess: function (oResult, oEmployeeModel, oBusyDialog) {
            var fCalculatedSalary = oResult.value || oResult;
            var sSalary = fCalculatedSalary.toString();
            
            oEmployeeModel.setProperty("/salary", sSalary);
            oBusyDialog.close();

            this._showCalculationSuccess(fCalculatedSalary);
        },

        _showCalculationSuccess: function (fCalculatedSalary) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("salaryCalculated") + ": " + formatter.formatSalary(fCalculatedSalary);
                MessageToast.show(sMessage);
            }
        },

        _handleCalculationError: function (oBusyDialog) {
            oBusyDialog.close();
            this._showPermissionError("errorCalculatingSalary");
        },

        _showPermissionError: function (sMessageKey) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle && sMessageKey) {
                var sMessage = oResourceBundle.getText(sMessageKey);
                MessageBox.error(sMessage);
            }
        },

        _clearValidationStates: function () {
            var aFieldIds = [
                "firstNameInput", "lastNameInput", "emailInput", "dobInput",
                "hireDateInput", "genderInput", "departmentInput", "roleInput"
            ];

            aFieldIds.forEach(function (sFieldId) {
                var oField = this.byId(sFieldId);
                if (oField && oField.setValueState) {
                    oField.setValueState(sap.ui.core.ValueState.None);
                    oField.setValueStateText("");
                }
            }.bind(this));
        },

        _hasUnsavedChanges: function () {
            var oViewModel = this.getView().getModel("viewModel");
            var oEmployeeModel = this.getView().getModel("employeeModel");

            if (!oViewModel || !oEmployeeModel) {
                return false;
            }

            var oOriginalEmployee = oViewModel.getProperty("/originalEmployee");
            var oCurrentEmployee = oEmployeeModel.getData();

            if (!oOriginalEmployee || !oCurrentEmployee) {
                return false;
            }

            return this._compareEmployeeData(oOriginalEmployee, oCurrentEmployee);
        },

        _compareEmployeeData: function (oOriginalEmployee, oCurrentEmployee) {
            var aFieldsToCompare = [
                "firstName", "lastName", "email", "dateOfBirth", "gender", "hireDate"
            ];

            // Compare basic fields
            for (var i = 0; i < aFieldsToCompare.length; i++) {
                if (this._compareField(oOriginalEmployee, oCurrentEmployee, aFieldsToCompare[i])) {
                    return true;
                }
            }

            // Compare salary
            if (this._compareSalary(oOriginalEmployee, oCurrentEmployee)) {
                return true;
            }

            // Compare department and role
            return this._compareDepartmentAndRole(oOriginalEmployee, oCurrentEmployee);
        },

        _compareField: function (oOriginal, oCurrent, sField) {
            var originalValue = oOriginal[sField];
            var currentValue = oCurrent[sField];

            // Handle date comparison
            if (sField.includes("Date")) {
                originalValue = originalValue ? new Date(originalValue).toDateString() : "";
                currentValue = currentValue ? new Date(currentValue).toDateString() : "";
            }

            return originalValue !== currentValue;
        },

        _compareSalary: function (oOriginal, oCurrent) {
            var originalSalary = oOriginal.salary ? oOriginal.salary.toString() : "0";
            var currentSalary = oCurrent.salary ? oCurrent.salary.toString() : "0";
            
            return originalSalary !== currentSalary;
        },

        _compareDepartmentAndRole: function (oOriginal, oCurrent) {
            var originalDeptId = oOriginal.department ? oOriginal.department.ID : null;
            var currentDeptId = oCurrent.department ? oCurrent.department.ID : null;

            var originalRoleId = oOriginal.role ? oOriginal.role.ID : null;
            var currentRoleId = oCurrent.role ? oCurrent.role.ID : null;

            return originalDeptId !== currentDeptId || originalRoleId !== currentRoleId;
        },

        getResourceBundle: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found for resource bundle");
                return null;
            }

            var oI18nModel = oComponent.getModel("i18n");
            if (!oI18nModel) {
                console.error("i18n model not found");
                return null;
            }

            return oI18nModel.getResourceBundle();
        },

        onDeleteEmployee: function () {
            var oUserModel = this.getView().getModel("user");
            if (!oUserModel) {
                console.error("User model not found");
                return;
            }

            var bIsAdmin = oUserModel.getProperty("/isAdmin");
            if (!bIsAdmin) {
                this._showPermissionError("noPermissionDelete");
                return;
            }

            this._validateAndDeleteEmployee();
        },

        _validateAndDeleteEmployee: function () {
            var oEmployeeModel = this.getView().getModel("employeeModel");
            if (!oEmployeeModel) {
                console.error("Employee model not found");
                return;
            }

            var oEmployee = oEmployeeModel.getData();
            if (!oEmployee || !oEmployee.ID) {
                this._showPermissionError("noEmployeeToDelete");
                return;
            }

            this._showDeleteConfirmation(oEmployee);
        },

        _showDeleteConfirmation: function (oEmployee) {
            var oResourceBundle = this.getResourceBundle();
            if (!oResourceBundle) {
                console.error("Resource bundle not found");
                return;
            }

            var sEmployeeName = oEmployee.firstName + " " + oEmployee.lastName;
            var sMessage = oResourceBundle.getText("confirmDeleteMessage", [sEmployeeName]);
            var sTitle = oResourceBundle.getText("confirmDeleteTitle");

            MessageBox.confirm(sMessage, {
                title: sTitle,
                actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.DELETE,
                onClose: this._handleDeleteConfirmation.bind(this, oEmployee)
            });
        },

        _handleDeleteConfirmation: function (oEmployee, oAction) {
            if (oAction === MessageBox.Action.DELETE) {
                this._performDelete(oEmployee);
            }
        },

        _performDelete: function (oEmployee) {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found for deletion");
                return;
            }

            var oODataModel = oComponent.getModel();
            if (!oODataModel) {
                console.error("OData model not found for deletion");
                return;
            }

            var oResourceBundle = this.getResourceBundle();
            var sText = oResourceBundle ? oResourceBundle.getText("deletingEmployee") : "Deleting...";
            var oBusyDialog = new BusyDialog({ text: sText });

            this._executeDelete(oODataModel, oEmployee, oBusyDialog);
        },

        _executeDelete: function (oODataModel, oEmployee, oBusyDialog) {
            try {
                oBusyDialog.open();
                var oListBinding = oODataModel.bindList("/Employees");
                var aFilters = [new Filter("ID", FilterOperator.EQ, oEmployee.ID)];
                oListBinding.filter(aFilters);

                this._processDeleteContexts(oListBinding, oODataModel, oBusyDialog);
            } catch (oError) {
                console.error("Error in delete operation:", oError);
                this._handleDeleteError(oBusyDialog);
            }
        },

        _processDeleteContexts: function (oListBinding, oODataModel, oBusyDialog) {
            oListBinding.requestContexts(0, 1).then(function (aContexts) {
                this._performContextDeletion(aContexts, oODataModel, oBusyDialog);
            }.bind(this)).catch(function (oError) {
                console.error("Error finding employee for deletion:", oError);
                this._handleDeleteError(oBusyDialog);
            }.bind(this));
        },

        _performContextDeletion: function (aContexts, oODataModel, oBusyDialog) {
            if (aContexts.length === 0) {
                console.error("Employee not found for deletion");
                this._handleDeleteError(oBusyDialog);
                return;
            }

            var oContext = aContexts[0];
            oContext.delete().then(function () {
                this._handleDeleteSuccess(oODataModel, oBusyDialog);
            }.bind(this)).catch(function (oError) {
                console.error("Error in context delete:", oError);
                this._handleDeleteError(oBusyDialog);
            }.bind(this));
        },

        _handleDeleteSuccess: function (oODataModel, oBusyDialog) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("employeeDeleted");
                MessageToast.show(sMessage);
            }
            
            oODataModel.submitBatch("$auto").then(function() {
                this._navigateToEmployeeList();
            }.bind(this)).finally(function () {
                oBusyDialog.close();
            }.bind(this));
        },

        _navigateToEmployeeList: function () {
            var oComponent = this.getOwnerComponent();
            if (!oComponent) {
                console.error("Component not found for navigation");
                return;
            }

            var oRouter = oComponent.getRouter();
            if (oRouter) {
                oRouter.navTo("employeeList", { refresh: "true" }, true);
            }
        },

        _handleDeleteError: function (oBusyDialog) {
            var oResourceBundle = this.getResourceBundle();
            if (oResourceBundle) {
                var sMessage = oResourceBundle.getText("errorDeletingEmployee");
                MessageBox.error(sMessage);
            }
            
            if (oBusyDialog) {
                oBusyDialog.close();
            }
        },

        _canDeleteEmployee: function (oEmployee) {
            var oUserModel = this.getView().getModel("user");
            if (!oUserModel) {
                return false;
            }
            
            var bIsAdmin = oUserModel.getProperty("/isAdmin");
            var bEmployeeExists = oEmployee && 
                                 oEmployee.ID && 
                                 typeof oEmployee.ID === "string" && 
                                 oEmployee.ID.trim() !== "";
            
            return bIsAdmin && bEmployeeExists;
        }
    });
});