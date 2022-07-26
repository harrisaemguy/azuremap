package ca.dc;

import java.io.IOException;

import javax.servlet.Servlet;
import javax.servlet.ServletException;

import org.apache.http.HttpEntity;
import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.util.EntityUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component(service = Servlet.class, property = { "sling.servlet.paths=" + "/bin/international/wf_p" })
@Designate(ocd = WorkflowProxy.Config.class)
public class WorkflowProxy extends SlingAllMethodsServlet {

  private ObjectMapper objectMapper = new ObjectMapper();
  protected CloseableHttpClient httpClient;

  private String targetHost;
  private int targetPort;
  private String targetUrl;
  private String username;
  private String password;

  private CloseableHttpClient getHttpClient() throws Exception {
    if (this.httpClient == null) {

      SSLContextBuilder builder = new SSLContextBuilder();
      builder.loadTrustMaterial(null, new TrustSelfSignedStrategy());
      SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(builder.build(), NoopHostnameVerifier.INSTANCE);

      CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
      credentialsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(username, password));
      this.httpClient = HttpClients.custom().setSSLSocketFactory(sslsf)
          .setDefaultCredentialsProvider(credentialsProvider).build();
    }

    return this.httpClient;
  }

  private void shutdown() throws Exception {
    getHttpClient().close();
  }

  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
      throws ServletException, IOException {

    HttpGet getReq = new HttpGet(this.targetUrl);

    try {

      // to avoid the Server sends back a challenge, set preemptive Authentication in AuthCache
      // otherwise, server might not response
      HttpHost host = new HttpHost(targetHost, targetPort);
      AuthCache authCache = new BasicAuthCache();
      BasicScheme basicAuth = new BasicScheme();
      authCache.put(host, basicAuth);
      HttpClientContext preemptive = HttpClientContext.create();
      preemptive.setAuthCache(authCache);

      String resp = getHttpClient().execute(host, getReq, new ApiResponseHandler(), preemptive);

      response.setContentType("application/json");
      response.getWriter().write(resp);
    } catch (Exception e) {
      throw new RuntimeException(e);
    } finally {
      if (getReq != null) {
        getReq.releaseConnection();
      }
    }
  }

  @Activate
  protected void activate(Config config) {
    this.targetHost = config.targetHost();
    this.targetPort = config.targetPort();
    this.targetUrl = config.targetUrl();
    this.username = config.username();
    this.password = config.password();
  }

  @ObjectClassDefinition(name = "international.workitem.proxy", description = "")
  public @interface Config {

    @AttributeDefinition
    String targetHost() default "aemosgidev01";

    @AttributeDefinition
    int targetPort() default 4502;

    @AttributeDefinition
    String targetUrl() default "/bin/international/wf";

    @AttributeDefinition
    String username() default "wux3";

    @AttributeDefinition(type = AttributeType.PASSWORD)
    String password() default "^Jpxwu0328aem";
  }

  public class ApiResponseHandler implements ResponseHandler<String> {

    @Override
    public String handleResponse(HttpResponse response) throws ClientProtocolException, IOException {
      try {
        StatusLine statusLine = response.getStatusLine();
        int statusCode = statusLine.getStatusCode();

        HttpEntity entity = response.getEntity();
        String body = entity != null ? EntityUtils.toString(entity) : null;
        return body;
      } finally {
        EntityUtils.consumeQuietly(response.getEntity());
        if (response instanceof CloseableHttpResponse) {
          ((CloseableHttpResponse) response).close();
        }
      }
    }
  }
}
