package com.professorperson.ProfessorPerson.web;

public interface RestConnection {
    String get(String url);
    String post(String url, String data);

}
