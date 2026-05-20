package ru.fastid.dto;

public class LoginRequest {

    private String userLogin;
    private String password;
    private String clientId;

    public LoginRequest() {
    }

    public LoginRequest(String userLogin, String password, String clientId) {
        this.userLogin = userLogin;
        this.password = password;
        this.clientId = clientId;
    }

    public String getUserLogin() {
        return userLogin;
    }

    public void setUserLogin(String userLogin) {
        this.userLogin = userLogin;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
}
