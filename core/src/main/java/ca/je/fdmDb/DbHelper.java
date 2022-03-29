package ca.je.fdmDb;

import java.io.IOException;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.sql.DataSource;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.servlets.annotations.SlingServletPathsStrict;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.ComponentContext;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component(service = { Servlet.class }, enabled = true)
@SlingServletPathsStrict(paths = { "/bin/dbServices" }, methods = { "GET", "POST" }, selectors = { ".EMPTY." }, extensions = {
        "json" }, paths_strict = true)
public class DbHelper extends SlingAllMethodsServlet {

  private static final long serialVersionUID = 1L;

  private final Logger log = LoggerFactory.getLogger(getClass());

  private ObjectMapper objectMapper = new ObjectMapper();

  protected HashMap<String, Long> transactionStamps = new HashMap<String, Long>();
  protected HashMap<String, Connection> transactions = new HashMap<String, Connection>();

  // use DataSource directly from factory, or locate datasource dynamically using bundleContext
  // @Reference(target = "(&(objectclass=javax.sql.DataSource)(datasource.name=fdm.ds1))")
  // private DataSource ds;

  @Override
  protected void doPost(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws ServletException, IOException {
    resp.setContentType("application/json");
    String operationArguments = Optional.ofNullable(req.getParameter("operationArguments")).orElse(null);
    if (operationArguments != null) {
      try {
        String result = exec(operationArguments);

        resp.getWriter().write(result);
      } catch (Exception ex) {
        throw new ServletException(ex);
      }
    }
  }

  String operationArguments1 = "{operationName:select, tblName:str, selector:[str], filter:{a:b}, offset, limit}";
  String operationArguments2 = "{operationName:insert, tblName:str, payload:{a:b}}";
  String operationArguments3 = "{operationName:update, tblName:str, filter:{a:b}, payload:{a:b}}";
  String operationArguments4 = "{operationName:delete, tblName:str, filter:{a:b}}";
  String insertResult = "[{\"key\": 10051}]";

  // tblName, selector, filter
  private String exec(String operationArguments) throws Exception {

    log.info("operationArguments: " + operationArguments);

    ObjectNode arguments = this.objectMapper.readValue(operationArguments, ObjectNode.class);

    String operationName = arguments.has("operationName") ? arguments.get("operationName").asText() : null;
    String tblName = arguments.has("tblName") ? arguments.get("tblName").asText() : null;
    String requestId = arguments.has("requestId") ? arguments.get("requestId").asText() : null;
    boolean endTransaction = arguments.has("endTransaction") ? arguments.get("endTransaction").asBoolean() : false;

    if (operationName == null || tblName == null) {
      throw new Exception("Illegal operationArguments!!!");
    }

    Connection connection = null;
    if (requestId != null && !"SELECT".equals(operationName)) {
      if ((connection = transactions.get(requestId)) == null) {
        connection = getConnection(arguments);
        connection.setAutoCommit(false);
        transactions.put(requestId, connection);
      }

      // update timestamp
      transactionStamps.put(requestId, System.currentTimeMillis());
    } else {
      connection = getConnection(arguments);
    }

    String result = "[]";
    try {
      switch (operationName) {
      case "SELECT":
        ArrayNode selector = arguments.withArray("selector");
        ObjectNode filter = arguments.with("filter");
        int offset = arguments.has("offset") ? arguments.get("offset").asInt() : 0;
        int limit = arguments.has("limit") ? arguments.get("limit").asInt() : 100;

        ArrayList<String> selectlst = new ArrayList<String>();
        for (int i = 0; i < selector.size(); i++) {
          selectlst.add(selector.get(i).asText());
        }
        result = SqlUtil.select(connection, tblName, selectlst, filter, offset, limit);
        break;
      case "INSERT":
        ObjectNode payload = arguments.with("payload");

        result = SqlUtil.insert(connection, tblName, payload);
        break;
      case "UPDATE":
        payload = arguments.with("payload");
        String idName = arguments.get("idName").asText();
        String idVal = arguments.get("idVal").asText();

        SqlUtil.update(connection, tblName, payload, idName, idVal);
        result = "[]";
        break;
      case "DELETE":
        idName = arguments.get("idName").asText();
        idVal = arguments.get("idVal").asText();

        SqlUtil.delete(connection, tblName, idName, idVal);
        result = "[]";
        break;
      default:
      }
    } catch (Exception ex) {
      log.error("SQL error!", ex);
      if (requestId != null) {
        connection.rollback();
        connection.setAutoCommit(true);
        connection.close();
      }
      throw ex;
    }

    if (requestId != null && endTransaction) {
      log.info("endTransaction: " + requestId);
      transactionStamps.remove(requestId);
      transactions.remove(requestId);
      connection.commit();
      connection.setAutoCommit(true);
      connection.close();
    }

    if (requestId == null) {
      connection.close();
    }

    return result;
  }

  private Connection getConnection(ObjectNode arguments) throws Exception {

    if (arguments.has("DATA_SOURCE_NAME")) {

      String DATA_SOURCE_NAME = arguments.get("DATA_SOURCE_NAME").asText();

      Collection<ServiceReference<DataSource>> refs = bContext.getServiceReferences(DataSource.class, "(datasource.name=" + DATA_SOURCE_NAME + ")");
      if (refs.size() > 0) {
        ServiceReference<DataSource> ref = refs.iterator().next();
        DataSource dataSource = (DataSource) bContext.getService(ref);

        // Establish a connection with the external JDBC service
        Connection connection = dataSource.getConnection();
        return connection;
      } else {
        log.error("Unable to locate datasource for [ {} ]", DATA_SOURCE_NAME);
      }
    } else {
      log.error("Please specify [DATA_SOURCE_NAME]!");
    }

    return null;
  }

  private BundleContext bContext;
  private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
  private ScheduledFuture<?> beeperHandle;

  @Activate
  protected void activate(ComponentContext componentContext, BundleContext bundleContext) {
    // bundleContext.getServiceReferences(clazz, filter)
    this.bContext = bundleContext;

    try {
      // every 15 seconds
      beeperHandle = scheduler.scheduleAtFixedRate(new Runnable() {
        public void run() {
          Set<String> requestIds = transactionStamps.keySet();
          long now = System.currentTimeMillis();

          for (String requestId : requestIds) {
            long timeStamp = transactionStamps.get(requestId);

            if (now - timeStamp > 10000) {
              transactionStamps.remove(requestId);
              Connection connection = transactions.remove(requestId);
              try {
                connection.rollback();
                connection.setAutoCommit(true);
                connection.close();
                log.info("rollback transaction: " + requestId);
              } catch (Exception ex) {
                log.error(ex.getMessage());
              }
            }
          }
        }
      }, 10, 15, TimeUnit.SECONDS);

    } catch (Exception ex) {
      log.error(ex.getMessage());
    }
  }

  @Deactivate
  protected void deactivate() {
    beeperHandle.cancel(true);
  }
}
