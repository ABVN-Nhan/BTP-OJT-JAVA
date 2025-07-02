package customer.ojtjava.handlers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.greaterThan;
import com.jayway.jsonpath.JsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import org.springframework.http.MediaType;

@SpringBootTest
@AutoConfigureMockMvc
class EmployeeServiceHandlerTest {

    private static final String roleURI = "/odata/v4/ems/Roles";
    private static final String employeeURI = "/odata/v4/ems/Employees";
    private static final String departmentURI = "/odata/v4/ems/Departments";

    @Autowired
    private MockMvc mockMvc;

    /**
     * Test GET Api for Roles - validates response structure and content
     * 
     * @throws Exception
     */
    @Test
    @WithMockUser(username = "authenticated")
    void listRoles() throws Exception {
        MvcResult result = mockMvc.perform(get(roleURI))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.value", hasSize(4)))
                .andExpect(jsonPath("$.value[0].ID", notNullValue()))
                .andExpect(jsonPath("$.value[0].name", notNullValue()))
                .andReturn();
    }

    /**
     * Test GET Api for Departments - validates response structure and content
     * 
     * @throws Exception
     */
    @Test
    @WithMockUser(username = "authenticated")
    void listDepartments() throws Exception {
        MvcResult result = mockMvc.perform(get(departmentURI))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.value", hasSize(4)))
                .andExpect(jsonPath("$.value[0].ID", notNullValue()))
                .andExpect(jsonPath("$.value[0].name", notNullValue()))
                .andExpect(jsonPath("$.value[0].description", notNullValue()))
                .andReturn();
    }

    /**
     * Test GET Api for Employees - validates response structure and content
     * 
     * @throws Exception
     */
    @Test
    @WithMockUser(username = "authenticated")
    void listEmployee() throws Exception {
        MvcResult result = mockMvc.perform(get(employeeURI))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.value", hasSize(3)))
                .andExpect(jsonPath("$.value[0].ID", notNullValue()))
                .andExpect(jsonPath("$.value[0].firstName", notNullValue()))
                .andExpect(jsonPath("$.value[0].lastName", notNullValue()))
                .andExpect(jsonPath("$.value[0].email", notNullValue()))
                .andExpect(jsonPath("$.value[0].hireDate", notNullValue()))
                .andExpect(jsonPath("$.value[0].salary", greaterThan(0)))
                .andReturn();
    }
}