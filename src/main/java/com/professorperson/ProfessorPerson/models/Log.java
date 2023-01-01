package com.professorperson.ProfessorPerson.models;

public class Log {

    private int id;
    private String logTitle;
    private String logText;

    private double fontSize;

    private boolean visible;

    private String dateModified;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getLogText() {
        return logText;
    }

    public void setLogText(String logText) {
        this.logText = logText;
    }

    public double getFontSize() {
        return fontSize;
    }

    public void setFontSize(double fontSize) {
        this.fontSize = fontSize;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }

    public String getLogTitle() {
        return logTitle;
    }

    public void setLogTitle(String logTitle) {
        this.logTitle = logTitle;
    }

    public String getDateModified() {
        return dateModified;
    }

    public void setDateModified(String dateModified) {
        this.dateModified = dateModified;
    }
}
