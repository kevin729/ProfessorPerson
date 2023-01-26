package com.professorperson.ProfessorPerson.web;

public interface RestConnection {
    void authenticate(String token);
    String get(String url);
    String post(String url, String data);
    String put(String url, String data);
    String delete(String url, String data);
}
