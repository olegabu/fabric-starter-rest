package com.baeldung.jetty;

import org.eclipse.jetty.http.HttpVersion;
import org.eclipse.jetty.server.*;
import org.eclipse.jetty.servlet.ServletHandler;
import org.eclipse.jetty.util.resource.Resource;
import org.eclipse.jetty.util.ssl.SslContextFactory;
import org.eclipse.jetty.util.thread.QueuedThreadPool;

class JettyServer {

    private Server server;

    public static void main(String[] args) throws Exception {

        new JettyServer().start();
    }


    void start() throws Exception {

        int maxThreads = 100;
        int minThreads = 10;
        int idleTimeout = 120;

        QueuedThreadPool threadPool = new QueuedThreadPool(maxThreads, minThreads, idleTimeout);

        server = new Server(threadPool);

        SslContextFactory sslContextFactory = new SslContextFactory();
        sslContextFactory.setKeyStoreResource(Resource.newClassPathResource("keystore.jks"));
        sslContextFactory.setKeyStorePassword("123456");
        sslContextFactory.setKeyManagerPassword("123456");

        HttpConfiguration httpsConfiguration = new HttpConfiguration();
        SecureRequestCustomizer secureRequestCustomizer = new SecureRequestCustomizer();
        httpsConfiguration.addCustomizer(secureRequestCustomizer);

//        ServerConnector connector = new ServerConnector(server);
        ServerConnector connector = new ServerConnector(server,
                new SslConnectionFactory(sslContextFactory, HttpVersion.HTTP_1_1.asString()),
                new HttpConnectionFactory(httpsConfiguration));

        connector.setPort(8080);
        server.setConnectors(new Connector[] { connector });

        ServletHandler servletHandler = new ServletHandler();
        server.setHandler(servletHandler);

        servletHandler.addServletWithMapping(BlockingServlet.class, "/");

        server.start();

    }

    void stop() throws Exception {
        server.stop();
    }
}

