package ca.je.fdmDb;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.sql.DataSource;

import org.apache.commons.io.IOUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.request.RequestParameter;
import org.apache.sling.api.request.RequestParameterMap;
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
@SlingServletPathsStrict(paths = { "/bin/dbServices" }, methods = { "GET", "POST" }, selectors = { ".EMPTY." }, extensions = { "json",
        "dor" }, paths_strict = true)
public class DbHelper extends SlingAllMethodsServlet {

  private static final long serialVersionUID = 1L;

  private final Logger log = LoggerFactory.getLogger(getClass());

  private ObjectMapper objectMapper = new ObjectMapper();

  protected HashMap<String, Long> transactionStamps = new HashMap<String, Long>();
  protected HashMap<String, Connection> transactions = new HashMap<String, Connection>();

  // use DataSource directly from factory, or locate datasource dynamically using bundleContext
  // @Reference(target = "(&(objectclass=javax.sql.DataSource)(datasource.name=fdm.ds1))")
  // private DataSource ds;

  // DATA_SOURCE_NAME, tblName, selector, filter
  private void retrieveDor(SlingHttpServletResponse resp, String operationArguments) throws ServletException {
    try {
      String result = exec(objectMapper.readValue(operationArguments, ObjectNode.class));

      ArrayNode results = objectMapper.readValue(result, ArrayNode.class);
      if (results.size() == 1) {
        String photo64 = results.get(0).get("data").asText();
        String doc_name = results.get(0).get("FileName").asText();
        if (doc_name.endsWith(".pdf")) {
          resp.setContentType("application/pdf");
        } else if (doc_name.endsWith(".txt")) {
          resp.setContentType("text/plain");
        } else {
          resp.setContentType("image/png");
        }

        byte[] content = Base64.getDecoder().decode(photo64);
        ByteArrayInputStream bis = new ByteArrayInputStream(content);
        resp.setHeader("Content-disposition", "attachment; filename=" + doc_name);
        resp.setHeader("content-length", "" + content.length);
        OutputStream out = resp.getOutputStream();
        IOUtils.copy(bis, out);
        out.flush();
        bis.close();
      } else {
        resp.setContentType("application/json");
        resp.getWriter().write(result);
      }
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
  }

  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response) throws ServletException, IOException {
    String reqUri = request.getRequestURI();
    if ("/bin/dbServices.dor".equals(reqUri)) {
      String key = request.getParameter("id");
      ObjectNode operationArguments = objectMapper.createObjectNode();
      operationArguments.put("DATA_SOURCE_NAME", "fdm.ds1");
      operationArguments.put("operationName", "SELECT");
      operationArguments.put("tblName", "document");
      ArrayNode selector = operationArguments.withArray("selector");
      selector.add("FileName");
      selector.add("data");
      ObjectNode filter = operationArguments.with("filter");
      filter.put("id", key);
      retrieveDor(response, operationArguments.toString());
    }
  }

  @Override
  protected void doPost(SlingHttpServletRequest req, SlingHttpServletResponse resp) throws ServletException, IOException {
    String reqUri = req.getRequestURI();
    if ("/bin/dbServices.dor".equals(reqUri)) {
      String operationArguments = Optional.ofNullable(req.getParameter("operationArguments")).orElse(null);
      if (operationArguments != null) {
        retrieveDor(resp, operationArguments);
      }
    } else {
      resp.setContentType("application/json");
      String operationArguments = Optional.ofNullable(req.getParameter("operationArguments")).orElse(null);
      boolean isUpload = false;

      RequestParameterMap requestParameterMap = req.getRequestParameterMap();
      for (Map.Entry<String, RequestParameter[]> entry : requestParameterMap.entrySet()) {
        String reqKey = entry.getKey();
        log.info("req entry Key: " + reqKey);
        RequestParameter[] params = entry.getValue();
        for (RequestParameter param : params) {
          if (!param.isFormField()) {
            // has a file
            isUpload = true;

            ObjectNode oprArguments = objectMapper.readValue(operationArguments, ObjectNode.class);
            oprArguments.with("payload").put("FileName", param.getFileName());

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            InputStream upload = param.getInputStream();
            IOUtils.copy(upload, bos);
            oprArguments.with("payload").put("data", bos.toByteArray());
            upload.close();
            bos.close();

            // save to document
            try {
              exec(oprArguments);
            } catch (Exception ex) {
              throw new ServletException(ex);
            }
          }
        }
      }

      if (isUpload) {
        resp.getWriter().write("[]");
      } else if (operationArguments != null) {
        // regular case, just do database
        try {
          String result = exec(objectMapper.readValue(operationArguments, ObjectNode.class));

          resp.getWriter().write(result);
        } catch (Exception ex) {
          throw new ServletException(ex);
        }
      }
    }
  }

  String operationArguments1 = "{operationName:select, tblName:str, selector:[str], filter:{a:b}, offset, limit}";
  String operationArguments2 = "{operationName:insert, tblName:str, payload:{a:b}}";
  String operationArguments3 = "{operationName:update, tblName:str, filter:{a:b}, payload:{a:b}}";
  String operationArguments4 = "{operationName:delete, tblName:str, filter:{a:b}}";
  String insertResult = "[{\"key\": 10051}]";

  // tblName, selector, filter
  private String exec(ObjectNode arguments) throws Exception {

    // log.info("operationArguments: " + operationArguments);

    // ObjectNode arguments = this.objectMapper.readValue(operationArguments, ObjectNode.class);

    String operationName = arguments.has("operationName") ? arguments.get("operationName").asText() : null;
    String tblName = arguments.has("tblName") ? arguments.get("tblName").asText() : null;
    String requestId = arguments.has("requestId") ? arguments.get("requestId").asText() : null;
    boolean endTransaction = arguments.has("endTransaction") ? arguments.get("endTransaction").asBoolean() : false;

    if (operationName == null || tblName == null) {
      throw new Exception("Illegal operationArguments!!!");
    }

    if (arguments.has("payload")) {
      ObjectNode payload = arguments.with("payload");
      Iterator<String> names = payload.fieldNames();
      while (names.hasNext()) {
        String name = names.next();
        if (name.endsWith("_B")) {
          payload.put(name.substring(0, name.length() - 2), payload.get(name).binaryValue());
          payload.remove(name);
        }
      }
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
