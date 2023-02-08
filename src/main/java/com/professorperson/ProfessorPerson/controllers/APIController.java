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

    @GetMapping("/api/logs/{userId}")
    public List<Log> logs(@PathVariable int userId, HttpServletRequest request) {
        Optional<String> token = extractToken(request);

        if (token.isPresent()) {
            String json = connection.get("http://localhost:8080/profile/get_logs/"+userId, token.get());
            List<Log> logs = new Gson().fromJson(json, List.class);
            return logs;
        } else {
            String json = connection.get("http://localhost:8080/api/get_logs/"+userId, "");
            List<Log> logs = new Gson().fromJson(json, List.class);
            return logs;
        }
    }

    @PostMapping("/api/logbytitle/{userId}")
    public Log logByTitle(@RequestBody ViewLog data, @PathVariable int userId, HttpServletRequest request) throws UnsupportedEncodingException {
        Optional<String> token = extractToken(request);

        if (token.isPresent()) {
            String json = connection.get("http://localhost:8080/profile/get_log_by_Title/"+ UriUtils.encode(data.getTitle(), "UTF-8")+"/"+userId, token.get());
            Log log = new Gson().fromJson(json, Log.class);
            return log;
        } else {
            String json = connection.get("http://localhost:8080/api/get_log_by_Title/"+ UriUtils.encode(data.getTitle(), "UTF-8")+"/"+userId, "");
            Log log = new Gson().fromJson(json, Log.class);
            return log;
        }
    }

    @PostMapping("/api/log/{userId}")
    public Log postLog(@RequestBody Log log, @PathVariable int userId, HttpServletRequest request) {
        Optional<String> token = extractToken(request);
        String responseJson = connection.post("http://localhost:8080/profile/create_log/"+userId, new Gson().toJson(log), token.get());
        System.out.println(responseJson);
        Log response = new Gson().fromJson(responseJson, Log.class);
        return response;
    }

    @PutMapping("/api/log")
    public void putLog(@RequestBody Log log, HttpServletRequest request) {
        Optional<String> token = extractToken(request);

        if (token.isPresent()) {
            String logRequest = new Gson().toJson(log);
            connection.put("http://localhost:8080/profile/modify_log", logRequest, token.get());
        }
    }

    @DeleteMapping("/api/log/{id}/{userId}")
    public List<Log> deleteLog(@PathVariable int id, @PathVariable int userId, HttpServletRequest request) {
        Optional<String> token = extractToken(request);
        String responseJson = connection.delete("http://localhost:8080/profile/delete_log/"+id+"/"+userId, null, token.get());
        List<Log> logs = new Gson().fromJson(responseJson, List.class);
        return logs;
    }

    @GetMapping("/api/csrf")
    public CsrfToken getCsrfToken(HttpServletRequest request) {
        CsrfToken token = new HttpSessionCsrfTokenRepository().loadToken(request);
        return token;
    }

    private Optional<String> extractToken(HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader("Authorization"));
    }
}
