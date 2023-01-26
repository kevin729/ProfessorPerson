package com.professorperson.ProfessorPerson.web;

public interface RestConnection {
    String get(String url, String bearer);
    String post(String url, String data, String bearer);
    String put(String url, String data, String bearer);
    String delete(String url, String data, String bearer);
}
