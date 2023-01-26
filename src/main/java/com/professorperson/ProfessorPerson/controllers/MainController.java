package com.professorperson.ProfessorPerson.controllers;

import com.professorperson.ProfessorPerson.web.RestConnection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/log")
    public String log() {
        return "index";
    }

    @GetMapping("/log/edit")
    public String editLog() {
        return "index";
    }

    @GetMapping("/contact")
    public String contact() {
        return "index";
    }
}
