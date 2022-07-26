package ca.dc;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowService;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.Workflow;
import com.day.cq.workflow.metadata.MetaDataMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component(service = Servlet.class, property = { "sling.servlet.paths=" + "/bin/international/wf" })
public class WorkflowTest extends SlingAllMethodsServlet {

  @Reference
  private ResourceResolverFactory resourceResolverFactory;

  @Reference
  private WorkflowService workflowService;

  private ObjectMapper objectMapper = new ObjectMapper();

  //ex: workflowId = /var/workflow/instances/server0/2022-06-08_5/basic_10
  private void workflowDetail(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {
    String workflowId = request.getParameter("workflowId");

    ResourceResolver resourceResolver = request.getResourceResolver();
    Session session = (Session) resourceResolver.adaptTo((Class) Session.class);
    response.setContentType("text/plain");
    WorkflowSession wfSession = workflowService.getWorkflowSession(session);
    try {
      Workflow workflow = wfSession.getWorkflow(workflowId);
      response.getWriter().println(workflow.getState());
      List<WorkItem> items = workflow.getWorkItems();
      for (WorkItem item : items) {
        // http://localhost:4502/aem/dashboard/formdetails.html?item=item_id 
        response.getWriter().println(item.getId());
      }
      response.getWriter().println();
    } catch (WorkflowException e) {
      e.printStackTrace();
    }
  }

  private void listRunning(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {
    ResourceResolver resourceResolver = request.getResourceResolver();
    Session session = (Session) resourceResolver.adaptTo((Class) Session.class);

    String[] states = { "RUNNING" };

    response.setContentType("application/json");

    WorkflowSession wfSession = workflowService.getWorkflowSession(session);
    try {
      Workflow[] workflows = wfSession.getWorkflows(states);

      ArrayNode inboxItems = objectMapper.createArrayNode();

      //Workflow[] workflows = wfSession.getAllWorkflows();
      for (Workflow workflow : workflows) {
        ObjectNode item = inboxItems.addObject();
        item.put("title", workflow.getWorkflowModel().getTitle());
        // /var/workflow/instances/server0/2022-06-08_5/basic_10
        item.put("workflow_id", workflow.getId());
        item.put("status", workflow.getState());
        List<WorkItem> items = workflow.getWorkItems();
        for (WorkItem witem : items) {
          // http://localhost:4502/aem/dashboard/formdetails.html?item=item_id 
          item.put("item_id", witem.getId());
        }
      }

      response.getWriter().write(inboxItems.toString());
    } catch (WorkflowException e) {
      e.printStackTrace();
    }
  }

  private void listMyItems(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {

    ResourceResolver resourceResolver = request.getResourceResolver();
    Session session = (Session) resourceResolver.adaptTo((Class) Session.class);
    response.setContentType("application/json");
    WorkflowSession wfSession = workflowService.getWorkflowSession(session);

    try {
      ArrayNode inboxItems = objectMapper.createArrayNode();
      WorkItem[] items = wfSession.getActiveWorkItems();
      for (WorkItem item : items) {
        ObjectNode objNd = inboxItems.addObject();
        objNd.put("assignee", item.getCurrentAssignee());
        objNd.put("itemId", item.getId());
        MetaDataMap dataMap = item.getWorkflowData().getMetaDataMap();
        Set<String> names = dataMap.keySet();
        for (String name : names) {
          Object val = dataMap.get(name);
          if (val instanceof String) {
            objNd.put(name, val.toString());
          }
        }
      }

      response.getWriter().write(inboxItems.toString());
    } catch (WorkflowException e) {
      e.printStackTrace();
    }
  }

  private void listAllActiveItems(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {

        response.getWriter().write("listAllActiveItems");
    Map<String, Object> map = new HashMap<String, Object>();
    map.put(ResourceResolverFactory.SUBSERVICE, "Workflow-user");
    ResourceResolver resourceResolver = null;
    try {
      resourceResolver = resourceResolverFactory.getServiceResourceResolver(map);
      response.getWriter().write("resourceResolver");


    Session session = (Session) resourceResolver.adaptTo((Class) Session.class);
    response.setContentType("application/json");
    WorkflowSession wfSession = workflowService.getWorkflowSession(session);


      ArrayNode inboxItems = objectMapper.createArrayNode();
      WorkItem[] items = wfSession.getActiveWorkItems();
      for (WorkItem item : items) {
        ObjectNode objNd = inboxItems.addObject();
        objNd.put("assignee", item.getCurrentAssignee());
        objNd.put("itemId", item.getId());
        MetaDataMap dataMap = item.getWorkflowData().getMetaDataMap();
        Set<String> names = dataMap.keySet();
        /*for (String name : names) {
          Object val = dataMap.get(name);
          if (val instanceof String) {
            objNd.put(name, val.toString());
          }
        }*/
      }

      response.getWriter().write(inboxItems.toString());
    } catch (Exception e) {
      response.getWriter().write(e.getMessage());
      e.printStackTrace();
    } finally {
      resourceResolver.close();
    }

  }

  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {
    try {
      response.getWriter().write("do Get");
      listAllActiveItems(request, response);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
