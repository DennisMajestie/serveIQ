export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["OWNER"] = "owner";
    UserRole["MANAGER"] = "manager";
    UserRole["WAITER"] = "waiter";
    UserRole["CASHIER"] = "cashier";
})(UserRole || (UserRole = {}));
export var TabStatus;
(function (TabStatus) {
    TabStatus["OPEN"] = "open";
    TabStatus["BILLED"] = "billed";
    TabStatus["PAID"] = "paid";
    TabStatus["VOIDED"] = "voided";
})(TabStatus || (TabStatus = {}));
export var TableStatus;
(function (TableStatus) {
    TableStatus["AVAILABLE"] = "available";
    TableStatus["OCCUPIED"] = "occupied";
    TableStatus["RESERVED"] = "reserved";
})(TableStatus || (TableStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["TRANSFER"] = "transfer";
    PaymentMethod["POS"] = "pos";
    PaymentMethod["CARD"] = "card";
})(PaymentMethod || (PaymentMethod = {}));
//# sourceMappingURL=shared.js.map