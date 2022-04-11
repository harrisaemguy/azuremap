package ca.dc.tested.prefill;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import javax.jcr.Session;

import org.apache.jackrabbit.api.JackrabbitSession;
import org.apache.jackrabbit.api.security.user.Authorizable;
import org.apache.jackrabbit.api.security.user.UserManager;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ValueMap;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.adobe.forms.common.service.ContentType;
import com.adobe.forms.common.service.DataOptions;
import com.adobe.forms.common.service.DataProvider;
import com.adobe.forms.common.service.FormsException;
import com.adobe.forms.common.service.PrefillData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

// filename: x.schema.json
//{
//  "$schema": "https://json-schema.org/draft-04/schema#",
//  "type": "object",
//  "properties": {
//  }
//}

// only works when your form is created with empty json schema, you can call guideBridge.getData() in json format
// if no schema, the expected format is xml

// or use org.apache.sling.rewriter.Processor to put following:
// slingRequest.setAttribute("data", dataJson);
@Component
public class PrefillAdaptiveFormJson implements DataProvider {
  private static final Logger log;

  private ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public PrefillData getPrefillData(DataOptions dataOptions) throws FormsException {
    PrefillData prefillData = new PrefillData(getDataForDataRef(dataOptions), ContentType.JSON);
    return prefillData;
  }

  public InputStream getDataForDataRef(final DataOptions dataXmlOptions) throws FormsException {
    log.info("Geting json");
    ObjectNode prefillObj = objectMapper.createObjectNode();
    prefillObj.with("data").put("fname", "xilu");

    Resource aemFormContainer = dataXmlOptions.getFormResource();
    ResourceResolver resolver = aemFormContainer.getResourceResolver();
    Session session = (Session) resolver.adaptTo((Class) Session.class);
    try {
      UserManager um = ((JackrabbitSession) session).getUserManager();
      Authorizable loggedinUser = um.getAuthorizable(session.getUserID());
      if (loggedinUser.hasProperty("profile/givenName")) {
        String fname = loggedinUser.getProperty("profile/givenName")[0].getString();
        prefillObj.with("data").put("fname", fname);
      }
      if (loggedinUser.hasProperty("profile/email")) {
        String email = loggedinUser.getProperty("profile/email")[0].getString();
        prefillObj.with("data").put("email", email);
      }
    } catch (Exception e) {
      throw new FormsException(e);
    }

    ValueMap vm = aemFormContainer.getValueMap();
    String lastModified = vm.get("jcr:lastModified", "");
    prefillObj.with("data").putPOJO("lastModified", lastModified);

    Resource globalMetaInfo = aemFormContainer.getChild("globalMetaInfo");
    if (globalMetaInfo != null) {
      String[] metadata = globalMetaInfo.getValueMap().get("metadata", String[].class);
      ArrayNode md = prefillObj.with("data").withArray("metadata");
      for (String kv : metadata) {
        ObjectNode obj;
        try {
          obj = objectMapper.readValue(kv, ObjectNode.class);
          md.add(obj);
        } catch (JsonProcessingException e) {
          e.printStackTrace();
        }
      }
    }

    InputStream xmlDataStream = new ByteArrayInputStream(prefillObj.toString().getBytes());
    return xmlDataStream;
  }

  public String getServiceDescription() {
    return "Json Pre Fill Service";
  }

  public String getServiceName() {
    return "JsonPrefillService";
  }

  static {
    log = LoggerFactory.getLogger((Class) PrefillAdaptiveFormJson.class);
  }
}
