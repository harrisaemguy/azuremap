package ca.je.fdmDb;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

// json to transfer binary: Base64 has a high processing overhead.
// Also it expands 3 bytes into 4 characters which leads to an increased data size by around 33%.*aem657IRCC12345

public class SqlUtil {

  private final static Logger log = LoggerFactory.getLogger(SqlUtil.class);

  private static ObjectMapper objectMapper = new ObjectMapper();

  // select * from employees limit 10 offset 10;
  // select count(*) from employees where gender = 'M';
  protected static String select(Connection connection, String tblName, List<String> selector, ObjectNode filter) throws Exception {
    return select(connection, tblName, selector, filter, 0, 100);
  }

  protected static String select(Connection connection, String tblName, List<String> selector, ObjectNode filter, int offset) throws Exception {
    return select(connection, tblName, selector, filter, offset, 100);
  }

  private static String supported(Connection conn) throws Exception {
    String db_vender = conn.getMetaData().getDatabaseProductName();
    log.info("db vender: " + db_vender);
    if ("MySQL".equals(db_vender)) {
      return db_vender;
    }

    return null;
  }

  private static boolean isBase64(String someString) {
    try {
      Base64.getMimeDecoder().decode(someString);
    } catch (IllegalArgumentException ex) {
      return false;
    }

    return true;
  }

  protected static String select(Connection conn, String tblName, List<String> selector, ObjectNode filter, int offset, int limit) throws Exception {
    // Optional.ofNullable(supported(conn)).orElseThrow(UnsupportedDatabaseException::new);
    StringBuilder sql = new StringBuilder("SELECT");

    if (selector != null && selector.size() > 0) {
      for (int i = 0; i < selector.size(); i++) {
        if (i == 0) {
          sql.append(" ");
        } else {
          sql.append(", ");
        }
        sql.append(selector.get(i));
      }
    } else {
      sql.append(" *");
    }

    sql.append(" FROM ").append(tblName);

    if (filter != null && !filter.isEmpty()) {
      sql.append(" WHERE");
      Iterator<String> filters = filter.fieldNames();
      String condition = " ";
      while (filters.hasNext()) {
        sql.append(condition);
        String name = filters.next();
        JsonNode val = filter.get(name);
        if (val.isTextual()) {
          sql.append(name).append("=").append("'").append(val.asText()).append("'");
        } else if (val.isNull()) {
          sql.append(name).append(" IS NULL");
        } else {
          sql.append(name).append("=").append(val.asText());
        }

        condition = " AND";
      }
    }

    sql.append(" limit ").append(limit).append(" offset ").append(offset);
    Statement stmt = conn.createStatement();

    String sqlStr = sql.toString();
    log.info("select(): " + sqlStr);

    ResultSet rs = stmt.executeQuery(sqlStr);
    ArrayNode arrayNode = objectMapper.createArrayNode();
    while (rs.next()) {
      ObjectNode obj = arrayNode.addObject();
      for (String fld : selector) {
        Object val = rs.getObject(fld);

        // auto encode to base64 if isBinary
        obj.putPOJO(fld, val);
      }
    }

    stmt.closeOnCompletion();

    return arrayNode.toString();
  }

  protected static String insert(Connection conn, String tblName, ObjectNode jsonBody) throws Exception {

    StringBuilder sql = new StringBuilder();
    sql.append("INSERT INTO ").append(tblName);

    StringBuilder sql1 = new StringBuilder(" (");
    StringBuilder sql2 = new StringBuilder(" VALUES(");
    ArrayList<JsonNode> valLst = new ArrayList<JsonNode>();

    Iterator<String> names = jsonBody.fieldNames();
    String condition = "";
    while (names.hasNext()) {
      sql1.append(condition);
      sql2.append(condition);
      String name = names.next();
      JsonNode val = jsonBody.get(name);
      sql1.append(name);
      sql2.append("?");
      valLst.add(val);

      condition = ", ";
    }
    sql1.append(")");
    sql2.append(")");

    sql.append(sql1.toString()).append(sql2.toString());
    String sqlStr = sql.toString();
    log.info("insert(): " + sqlStr);

    PreparedStatement ps = conn.prepareStatement(sqlStr, Statement.RETURN_GENERATED_KEYS);
    for (int i = 0; i < valLst.size(); i++) {
      JsonNode val = valLst.get(i);

      if (isBase64(val.asText())) {
        byte[] bytes = val.binaryValue();
        ps.setBytes(i + 1, bytes);
      } else {
        ps.setString(i + 1, val.asText());
      }
    }

    ps.execute();

    ResultSet rs = ps.getGeneratedKeys();
    int generatedKey = 0;
    if (rs.next()) {
      generatedKey = rs.getInt(1);
    }

    ps.closeOnCompletion();

    ArrayNode arrayNode = objectMapper.createArrayNode();
    ObjectNode obj = arrayNode.addObject();
    obj.put("key", generatedKey);
    log.info("insert() return: " + arrayNode.toString());
    return arrayNode.toString();
  }

  protected static void update(Connection conn, String tblName, ObjectNode jsonBody, String idName, String idVal) throws Exception {

    StringBuilder sql = new StringBuilder();
    sql.append("UPDATE ").append(tblName).append(" SET ");

    ArrayList<JsonNode> valLst = new ArrayList<JsonNode>();
    if (jsonBody != null && !jsonBody.isEmpty()) {
      Iterator<String> names = jsonBody.fieldNames();
      String condition = "";
      while (names.hasNext()) {
        sql.append(condition);
        String name = names.next();
        JsonNode val = jsonBody.get(name);
        valLst.add(val);
        sql.append(name).append("=?");

        condition = ", ";
      }
      sql.append(" WHERE ");
      sql.append(idName);
      sql.append("=");
      sql.append(idVal);

      String sqlStr = sql.toString();
      log.info("update(): " + sqlStr);

      PreparedStatement ps = conn.prepareStatement(sqlStr);
      for (int i = 0; i < valLst.size(); i++) {
        JsonNode val = valLst.get(i);

        if (isBase64(val.asText())) {
          byte[] bytes = val.binaryValue();
          ps.setBytes(i + 1, bytes);
        } else {
          ps.setString(i + 1, val.asText());
        }
      }
      ps.executeUpdate();
      ps.closeOnCompletion();
    }
  }

  protected static void delete(Connection conn, String tblName, String idName, String idVal) throws Exception {
    StringBuilder sql = new StringBuilder("DELETE FROM ");
    sql.append(tblName);
    sql.append(" WHERE");
    sql.append(" ").append(idName).append("=").append(idVal);

    String sqlStr = sql.toString();
    log.info("delete(): " + sqlStr);
    Statement stmt = conn.createStatement();
    stmt.executeUpdate(sqlStr);
    stmt.closeOnCompletion();
  }

}
