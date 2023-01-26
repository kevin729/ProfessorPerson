package com.professorperson.ProfessorPerson.lukemind;

import com.professorperson.ProfessorPerson.web.HttpUtils;
import com.professorperson.ProfessorPerson.web.RestConnection;
import org.springframework.stereotype.Component;

@Component
public class LukeMindRestConnection implements RestConnection {
    private StringBuilder bearerAuthentication = new StringBuilder();

    @Override
    public void authenticate(String bearerAuthentication) {
        this.bearerAuthentication.append(bearerAuthentication);
    }

    @Override
    public String get(String url) {
        return HttpUtils.restService(url, "GET", "application/json", null, bearerAuthentication);
    }

    @Override
    public String post(String url, String data) {
        return HttpUtils.restService(url, "POST", "application/json", data, bearerAuthentication);
    }

    @Override
    public String put(String url, String data) {
        return HttpUtils.restService(url, "PUT", "application/json", data, bearerAuthentication);
    }

    @Override
    public String delete(String url, String data) {
        return HttpUtils.restService(url, "DELETE", "application/json", data, bearerAuthentication);
    }
}
