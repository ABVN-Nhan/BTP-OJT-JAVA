using abvn.nhantran as my from '../db/schema';

@path    : '/ems'
@requires: 'authenticated-user'
@restrict: [
    {
        grant: '*',
        to   : 'admin'
    },
    {
        grant: 'READ',
        to   : 'viewer'
    }
]
service EmployeeService {
    entity Roles       as projection on my.Roles;
    entity Departments as projection on my.Departments;
    entity Employees   as projection on my.Employees;
    function calculateSalary(roleId : UUID, hireDate : Date) returns Decimal;

    function getCurrentUserInfo() returns {
        userId          : String;
        isAuthenticated : Boolean;
        roles           : {
            admin   : Boolean;
            viewer  : Boolean;
        };
    };
}
