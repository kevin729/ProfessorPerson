package com.professorperson.ProfessorPerson.controllers;

import com.google.gson.Gson;
import com.professorperson.ProfessorPerson.models.Log;
import com.professorperson.ProfessorPerson.web.RestConnection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.bind.annotation.*;
import com.professorperson.ProfessorPerson.viewmodels.ViewLog;
import org.springframework.web.util.UriUtils;


import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
public class APIController {

    @Autowired
    private RestConnection connection;

    @GetMapping("api/logtitles")
    public List<String> logTitles() {
        String json = connection.get("http://192.168.0.21:8080/profile/get_log_titles/1");
        List<String> logs = new Gson().fromJson(json, List.class);
        return logs;
    }

    @GetMapping("/api/logs")
    public List<Log> logs() {
        String json = connection.get("http://192.168.0.21:8080/profile/get_logs/1");
        List<Log> logs = new Gson().fromJson(json, List.class);
        return logs;
    }

    @PostMapping("/api/logbytitle")
    public Log logByTitle(@RequestBody ViewLog data) throws UnsupportedEncodingException {
        String json = connection.get("http://192.168.0.21:8080/api/get_log_by_Title/"+ UriUtils.encode(data.getTitle(), "UTF-8")+"/1");
        Log log = new Gson().fromJson(json, Log.class);
        return log;
    }

    @PutMapping("/api/log")
    public void postLog(@RequestBody Log log) {
        String request = new Gson().toJson(log);
        connection.put("http://192.168.0.21:8080/profile/modify_log", request);
    }

    @GetMapping("/api/csrf")
    public CsrfToken getCsrfToken(HttpServletRequest request) {
        CsrfToken token = new HttpSessionCsrfTokenRepository().loadToken(request);
        return token;
    }
}
