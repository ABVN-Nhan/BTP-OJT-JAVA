namespace abvn.nhantran;
using { cuid, managed } from '@sap/cds/common';

entity Roles: managed, cuid {
  name : String(50);
  baseSalary : Decimal(10,2);
}

entity Departments: managed, cuid {
  name : String(50);
}

entity Employees: managed, cuid {
  firstName : String(50);
  lastName : String(50);
  dateOfBirth : Date;
  gender : String(10);
  email : String(100);
  hireDate : Date;
  salary : Decimal(10,2);
  role : Association to Roles;
  department : Association to Departments;
}