package ca.dc;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.servlet.ServletException;

import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ResourceResolver;
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

@Component(service = Servlet.class, property = { "sling.servlet.paths=" + "/bin/dc/WF" })
public class WorkflowTest extends SlingAllMethodsServlet {

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
          objNd.put(name, val.toString());
        }
      }

      response.getWriter().write(inboxItems.toString());
    } catch (WorkflowException e) {
      e.printStackTrace();
    }
  }

  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {
    try {
      listMyItems(request, response);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
