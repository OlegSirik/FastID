package ru.fastid.dto;

public class FastIdPremiumRequest extends FastIdPersonData {

    private String productCode;
    private String packageCode;

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getPackageCode() {
        return packageCode;
    }

    public void setPackageCode(String packageCode) {
        this.packageCode = packageCode;
    }
}
