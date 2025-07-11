# BTP Training - CAP UI5 (Java Version)
## Objective
  Develop a full-stack employee management application on SAP BTP to manage employee records, linked to master data for roles and departments, with salary calculations based on role and years of service. 
Using CAP for backend services, SAPUI5 for the frontend, and SAP HANA Cloud as the database, mastering basic CAP (data modeling, associations, custom logic) and SAPUI5 (UI development, OData binding, navigation) concepts.
## Prerequisites
1.	SAP BTP Trial Account: Configured with Cloud Foundry, SAP HANA Cloud instance, and SAP Business Application Studio (BAS).
2.	Core knowledge: Node.js, JavaScript, XML, JSON, APIs, SQL.
3.	Source control: GitHub account
## Functional Requirements
### 1.	Data Models (CAP):
-   Roles: Master table with ID (UUID), name (e.g., Developer, Manager, Analyst), base salary (e.g., $50,000, $70,000, $40,000).
-   Departments: Master table with ID (UUID), name (e.g., IT, HR).
-   Employees: ID (UUID), firstName, lastName, email, hireDate, salary (calculated), role (linked to Roles), department (linked to Departments).
-   Relationships: One-to-one associations (Employee  Role, Employee  Department).
### 2.	Salary Calculation (CAP):
-   Base salary from Roles table.
-   Bonus: +$1,000 per year of service (from hireDate to current date).
-   Example: Developer hired May 18, 2022 → $50,000 + (3 × $1,000) = $53,000.
-   Logic implemented in CAP before CREATE/UPDATE of employee records.
### 3.	Backend Services (CAP):
-   Expose Roles, Departments, Employees as OData V4 endpoints.
-   Support CRUD operations and navigation between entities.
-   Deploy to SAP HANA Cloud.
### 4.	Frontend (SAPUI5 – Free style UI5):
-   List View: Display employees with name, role, department, email, and salary (formatted as USD/VND).
-   Detail View: Edit employee details (name, email, hireDate, role, department) with salary display (read-only).
-   Use ComboBox for role and department selection from master data.
-   Support navigation, CRUD operations, and OData binding.
-   Deploy to SAP BTP.
### 5.	Database (SAP HANA Cloud):
-   Persist Roles, Departments, Employees tables with relationships.
-   Support data retrieval and updates via CAP.
### 6.	GitHub Code Management: 
-   Create a GitHub repository for the project (employee-management).
-   Structure with branches: main (production-ready), develop (integration)
-   Commit changes for each major task (e.g., CAP model, SAPUI5 list views).
-   Use pull requests (PRs) to merge develop branches into main.
## Deliverables
-   Deployed CAP backend with OData services for Roles, Departments, Employees.
-   SAPUI5 frontend with list-detail views for employee management.
-   Populated SAP HANA Cloud database with sample data (e.g., 3 roles, 2 departments, 5 employees).
-   Report documenting challenges and lesson learnings.

##

# CAP Backend with Java 
## Build and Run

```bash
cd project
mvn spring-boot:run
```
Access OData service at: http://localhost:8080/

## Use SAP HANA as the Database
### Add dependencies to `srv/pom.xml`
```xml
<dependency>
  <groupId>com.sap.cds</groupId>
  <artifactId>cds-feature-hana</artifactId>
</dependency>
```
### Add hana service
```bash
cds add hana
```
### Config Database binding
Binding application to Hana
```bash
cds bind --to hana
```

Find credentials
```bash
cf service-key <service-name> <service-key>
```
Output be like 
```bash
{ 
    "credentials": {
        "url": "jdbc:sap://",
        "user": "",
        "password": "",
        "schema": "",
        "driver": "com.sap.db.jdbc.Driver",
        "host": "",
        "port": "443"
    }
}
```
Copy the credentials output, create `default-env.json` in project root and paste the output to body:
```json
{
  "VCAP_SERVICES": {
    "hana": [
      {
        "name": "db",
        "label": "hana",
        "tags": ["hana", "database", "relational"],
        "credentials": {
          "url": "jdbc:sap://",
          "user": "",
          "password": "",
          "schema": "",
          "driver": "com.sap.db.jdbc.Driver",
          "host": "",
          "port": "443"
        }
      }
    ]
  }
}
```
### Build for hana
```bash
cds build --for hana
```

### Deploy to hana
```bash
cds deploy -2 hana
```

## Using XSUAA with Hybrid Mode
### Config mock security in the `aplication.yaml` with profile ***cloud***
```yaml
spring:
  config.activate.on-profile: cloud
cds:
  index-page.enabled: true
  security.mock.enabled: true	
  security:
    mock.users:
        <user1>:
          roles: <role1>
        <user2>:
          roles: <role2>
        ...
```
### Add the `default-env.json` for database information
```json
{
  "VCAP_SERVICES": {
    "hana": [
      "..."
    ],
    "xsuaa": [
        {
            "name": "<NAME>",
            "label": "xsuaa",
            "plan": "application",
            "credentials": {
            "xsappname": "my-cap-java-app",
            "clientid": "sb-clientid",
            "clientsecret": "client-secret",
            "url": "https://<your-subdomain>.authentication.<region>.hana.ondemand.com",
            "uaaDomain": "<region>.hana.ondemand.com",
            "verificationkey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
            }
        }
    ]
  }
}

```

### Add dependencies for `pom.xml`
```xml
<dependency>
  <groupId>com.sap.cloud.security.xsuaa</groupId>
  <artifactId>spring-xsuaa</artifactId>
  <version>3.6.0</version>
</dependency>

```
### Define Roles and Scopes in `xs-security.json`

```json
{
  "xsappname": "my-cap-java-app",
  "tenant-mode": "dedicated",
  "scopes": [
    {
      "name": "$XSAPPNAME.<role1>",
      "description": "..."
    }
  ],
  "role-templates": [
    {
      "name": "<role1>",
      "description": "Role Description",
      "scope-references": [
        "$XSAPPNAME.<role1>"
      ]
    }
  ],
  "authorities-inheritance": false,
  "oauth2-configuration": {
    "redirect-uris": [
      "<url from error message>"
    ]
  }
}
```

### Run xsuaa service with Hybrid Mode
**Add xsuaa service and bind it follow the** [Capire tutorial](https://cap.cloud.sap/docs/node.js/authentication#xsuaa-setup)

Add App Router to the `app` folder of project:
```bash
cds add approuter
```
Install npm packages for App Router:
```bash
npm install --prefix app/router
```
In your project folder run in port 5000:

```bash
cds bind --exec -- npm start --prefix app/router
```

Run project with Hybrid Mode
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=cloud
```

## Deploy to BTP Cloud Foundry
Make sure to have enough module and resource in `mta.yaml`

```yaml
# html5 runtime
modules:
  - name: <module-name>
      type: approuter.nodejs
      path: app/router
      requires:
        ...
        - name: html5-apps-repo-runtime
...
resources:
  - name: html5-apps-repo-runtime
    type: org.cloudfoundry.managed-service
    parameters:
      service: html5-apps-repo
      service-plan: app-runtime
```
Run this command to both build and deploy:
```bash
cds up
```
If catch error `Internal Server Error (500)`, run this command in terminal and restart the deployed app:
```bash
cf set-env <service-name> COOKIE_BACKWARD_COMPATIBILITY true
cf restart <service-name>
```
