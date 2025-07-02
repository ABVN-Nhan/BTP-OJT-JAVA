using abvn.nhantran as my from '../db/schema';

@path: '/ems'
// @requires: 'authenticated-user'
// @restrict: [{
//     grant: '*',
//     to   : 'Admin'
// },
// {
//     grant: 'READ',
//     to   : 'Viewer'
// }]
service EmployeeService {
    entity Roles as projection on my.Roles;
    entity Departments as projection on my.Departments;
    entity Employees as projection on my.Employees;
}