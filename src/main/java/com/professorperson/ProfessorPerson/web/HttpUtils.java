package com.professorperson.ProfessorPerson.web;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

public class HttpUtils {

    public static String restService(String _url, String method, String contentType, String data, StringBuilder bearerAuthentication) {
        try {
            URL url = new URL(_url);
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod(method);

            con.setRequestProperty("Authorization", bearerAuthentication.toString());

            if (contentType.equals("text/plain")) {
                //data type
                con.setRequestProperty("Content-Type", contentType);
            } else {
                //data type
                con.setRequestProperty("Content-Type", contentType);
                //response
                con.setRequestProperty("Accept", contentType);
            }

            //body
            if (data != "" && data != null) {
                con.setDoOutput(true);
                try (OutputStream os = con.getOutputStream()) {
                    byte[] input = data.getBytes("utf-8");
                    os.write(input);
                    os.flush();
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            if (con.getResponseCode() != 200) {
                return Integer.toString(con.getResponseCode());
            }

            //reads REST stream
            BufferedReader br = new BufferedReader(new InputStreamReader(con.getInputStream()));
            String out = "";
            String tempOut = br.readLine();

            while (tempOut != null) {
                out += tempOut;
                tempOut = br.readLine();
            }

            return out;

        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

        bearerAuthentication.setLength(0);
        return "";
    }
}
