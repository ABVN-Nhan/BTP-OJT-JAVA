sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formats salary as currency
         * @param {number} fSalary The salary value
         * @returns {string} Formatted salary string
         */
        formatSalary: function (fSalary) {
            if (!fSalary || fSalary === 0) {
                return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(0);
            }
            
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(fSalary);
        },

        /**
         * Calculates and formats years of experience based on hire date
         * @param {string|Date} vHireDate The hire date
         * @returns {string} Formatted years of experience
         */
        formatYearsOfExperience: function (vHireDate) {
            if (!vHireDate) {
                return "0 years";
            }
            
            var oHireDate = vHireDate instanceof Date ? vHireDate : new Date(vHireDate);
            if (isNaN(oHireDate.getTime())) {
                return "0 years";
            }
            
            var oToday = new Date();
            var iYears = oToday.getFullYear() - oHireDate.getFullYear();
            
            // Adjust for months and days
            var iMonthDiff = oToday.getMonth() - oHireDate.getMonth();
            if (iMonthDiff < 0 || (iMonthDiff === 0 && oToday.getDate() < oHireDate.getDate())) {
                iYears--;
            }
            
            // Ensure we don't show negative years
            iYears = Math.max(0, iYears);
            
            return iYears + (iYears === 1 ? " year" : " years");
        },

        /**
         * Formats employee title with name and ID
         * @param {string} sFirstName First name
         * @param {string} sLastName Last name
         * @param {string} sId Employee ID
         * @returns {string} Formatted employee title
         */
        formatEmployeeTitle: function (sFirstName, sLastName, sId) {
            var sName = ((sFirstName || "") + " " + (sLastName || "")).trim();
            
            if (!sName && !sId) {
                return "Employee Details";
            }
            
            if (!sName) {
                return "Employee (" + sId + ")";
            }
            
            return sName + (sId ? " (" + sId + ")" : "");
        },

        /**
         * Formats full name from first and last name
         * @param {string} sFirstName First name
         * @param {string} sLastName Last name
         * @returns {string} Full name
         */
        formatFullName: function (sFirstName, sLastName) {
            return ((sFirstName || "") + " " + (sLastName || "")).trim() || "Unknown";
        },

        /**
         * Formats date for display
         * @param {string|Date} vDate The date value
         * @returns {string} Formatted date string
         */
        formatDate: function (vDate) {
            if (!vDate) {
                return "";
            }
            
            var oDate = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(oDate.getTime())) {
                return "";
            }
            
            return oDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
});