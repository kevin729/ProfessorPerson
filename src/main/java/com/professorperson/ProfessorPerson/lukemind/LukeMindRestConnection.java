package com.professorperson.ProfessorPerson.lukemind;

import com.professorperson.ProfessorPerson.web.HttpUtils;
import com.professorperson.ProfessorPerson.web.RestConnection;
import org.springframework.stereotype.Component;

@Component
public class LukeMindRestConnection implements RestConnection {
    @Override
    public String get(String url) {
        return HttpUtils.restService(url, "GET", "application/json", null);
    }

    @Override
    public String post(String url, String data) {
        return HttpUtils.restService(url, "POST", "application/json", data);
    }
}
