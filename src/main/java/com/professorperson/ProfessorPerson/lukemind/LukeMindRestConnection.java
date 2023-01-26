package com.professorperson.ProfessorPerson.lukemind;

import com.professorperson.ProfessorPerson.web.HttpUtils;
import com.professorperson.ProfessorPerson.web.RestConnection;
import org.springframework.stereotype.Component;

@Component
public class LukeMindRestConnection implements RestConnection {

    @Override
    public String get(String url, String bearer) {
        return HttpUtils.restService(url, "GET", "application/json", null, bearer);
    }

    @Override
    public String post(String url, String data, String bearer) {
        return HttpUtils.restService(url, "POST", "application/json", data, bearer);
    }

    @Override
    public String put(String url, String data, String bearer) {
        return HttpUtils.restService(url, "PUT", "application/json", data, bearer);
    }

    @Override
    public String delete(String url, String data, String bearer) {
        return HttpUtils.restService(url, "DELETE", "application/json", data, bearer);
    }
}
