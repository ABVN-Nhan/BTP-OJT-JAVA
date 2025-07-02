package customer.ojtjava.handlers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.sap.cds.Result;
import com.sap.cds.Struct;
import com.sap.cds.ql.Select;
import com.sap.cds.ql.Update;
import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CdsReadEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.After;
import com.sap.cds.services.handler.annotations.Before;
import com.sap.cds.services.handler.annotations.On;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.messages.Messages;
import com.sap.cds.services.persistence.PersistenceService;

import cds.gen.employeeservice.EmployeeService_;
import cds.gen.employeeservice.Employees;
import cds.gen.employeeservice.Roles;
import cds.gen.employeeservice.CalculateSalaryContext;
import org.slf4j.Logger;


@Component
@ServiceName("EmployeeService")
public class EmployeeServiceHandler implements EventHandler {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeServiceHandler.class);
    private PersistenceService db;

    public EmployeeServiceHandler(PersistenceService db) {
        this.db = db;
    }
}