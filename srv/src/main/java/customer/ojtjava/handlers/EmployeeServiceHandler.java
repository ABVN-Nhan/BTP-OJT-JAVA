package customer.ojtjava.handlers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.sap.cds.Result;
import com.sap.cds.Struct;
import com.sap.cds.ql.Select;
import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CdsUpdateEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.persistence.PersistenceService;
import com.sap.cds.services.request.UserInfo;

import cds.gen.employeeservice.CalculateSalaryContext;
import cds.gen.employeeservice.GetCurrentUserInfoContext;
import cds.gen.employeeservice.Employees;
import cds.gen.employeeservice.Employees_;
import cds.gen.employeeservice.Roles;
import cds.gen.employeeservice.Roles_;

@Component
@ServiceName("EmployeeService")
public class EmployeeServiceHandler implements EventHandler {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeServiceHandler.class);
    private static final BigDecimal BONUS_PER_YEAR = new BigDecimal("1000");

    private PersistenceService db;

    public EmployeeServiceHandler(PersistenceService db) {
        this.db = db;
    }

    // Event handler for getting current user information
    @On(event = "getCurrentUserInfo")
    public void onGetCurrentUserInfo(GetCurrentUserInfoContext context) {
        ArrayList<String> roles = new ArrayList<>();
        Map<String, Boolean> userRoleMap = new HashMap<>();
        Map<String, Object> userDetails = new HashMap<>();
        UserInfo userInfo = context.getUserInfo();
        
        roles.addAll(userInfo.getRoles());
        if (roles != null) {
            roles.forEach(role -> userRoleMap.put(role, true));
        }
        userDetails.put(GetCurrentUserInfoContext.ReturnType.USER_ID, userInfo.getName());
        userDetails.put(GetCurrentUserInfoContext.ReturnType.IS_AUTHENTICATED, userInfo.isAuthenticated());
        userDetails.put(GetCurrentUserInfoContext.ReturnType.ROLES, userRoleMap);

        GetCurrentUserInfoContext.ReturnType result = GetCurrentUserInfoContext.ReturnType.of(userDetails);
        logger.info("Returning user information: {}", result);
        context.setResult(result);
    }

    // Event handler for calculating salary
    @On(event = "calculateSalary")
    public void onCalculateSalary(CalculateSalaryContext context) {
        try {
            String roleId = context.getRoleId();
            LocalDate hireDate = context.getHireDate();

            if (roleId == null || hireDate == null) {
                logger.warn("Missing required parameters: roleId={}, hireDate={}", roleId, hireDate);
                context.setResult(BigDecimal.ZERO);
                return;
            }

            BigDecimal calculatedSalary = calculateSalary(roleId, hireDate);
            context.setResult(calculatedSalary);

            logger.info("Calculated salary: {} for roleId: {}", calculatedSalary, roleId);

        } catch (Exception e) {
            logger.error("Error calculating salary: {}", e.getMessage(), e);
            context.setResult(BigDecimal.ZERO);
        }
    }

    // Before CREATE event - calculate salary before creating employee
    @Before(event = CqnService.EVENT_CREATE, entity = Employees_.CDS_NAME)
    public void beforeCreateEmployee(CdsCreateEventContext context) {
        context.getCqn().entries().forEach(entry -> {
            Employees employee = Struct.access(entry).as(Employees.class);
            calculateAndSetSalary(employee);
        });
    }

    // Before UPDATE event - calculate salary before updating employee
    @Before(event = CqnService.EVENT_UPDATE, entity = Employees_.CDS_NAME)
    public void beforeUpdateEmployee(CdsUpdateEventContext context) {
        context.getCqn().entries().forEach(entry -> {
            Employees employee = Struct.access(entry).as(Employees.class);
            calculateAndSetSalary(employee);
        });
    }

    /*
     * Get base salary for a specific role
     */
    private BigDecimal getBaseSalaryForRole(String roleId) {
        try {
            Result roleResult = db.run(
                    Select.from(Roles_.class)
                            .where(role -> role.ID().eq(roleId)));

            if (roleResult.rowCount() == 0) {
                logger.warn("Role not found for ID: {}", roleId);
                return BigDecimal.ZERO;
            }

            Roles role = roleResult.single(Roles.class);
            BigDecimal baseSalary = role.getBaseSalary();

            if (baseSalary == null) {
                logger.warn("Base salary is null for role: {}", roleId);
                return BigDecimal.ZERO;
            }

            return baseSalary;

        } catch (Exception e) {
            logger.error("Error fetching base salary for role {}: {}", roleId, e.getMessage(), e);
            return BigDecimal.ZERO;
        }
    }

    /*
     * Calculate salary based on role and hire date
     */
    private BigDecimal calculateSalary(String roleId, LocalDate hireDate) {
        try {
            BigDecimal baseSalary = getBaseSalaryForRole(roleId);

            long yearsOfExp = ChronoUnit.YEARS.between(hireDate, LocalDate.now());
            BigDecimal yearlyBonus = BONUS_PER_YEAR.multiply(BigDecimal.valueOf(yearsOfExp));
            BigDecimal totalSalary = baseSalary.add(yearlyBonus);

            logger.debug("Salary calculation - Base: {}, Years: {}, Bonus: {}, Total: {}",
                    baseSalary, yearsOfExp, yearlyBonus, totalSalary);

            return totalSalary;

        } catch (Exception e) {
            logger.error("Error in salary calculation: {}", e.getMessage(), e);
            return BigDecimal.ZERO;
        }
    }

    /*
     * Calculate and set salary for employee
     */
    private void calculateAndSetSalary(Employees employee) {
        try {
            String roleId = employee.getRoleId();
            LocalDate hireDate = employee.getHireDate();

            if (roleId == null || hireDate == null) {
                logger.warn("Cannot calculate salary - missing roleId or hireDate");
                return;
            }

            BigDecimal calculatedSalary = calculateSalary(roleId, hireDate);
            employee.setSalary(calculatedSalary);

            logger.info("Salary calculated and set: {} for employee with roleId: {}",
                    calculatedSalary, roleId);

        } catch (Exception e) {
            logger.error("Error calculating salary for employee: {}", e.getMessage(), e);
        }
    }

}