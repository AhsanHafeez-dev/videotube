const validateEmail = function (email) { return email?.trim != ""; };

const validatePassword = function (password) {return password?.trim != "";};
const validateUsername = function (username) {return username?.trim != "";};
const validateFullName = function (fullName) { return fullName?.trim != ""; };
export { validateEmail, validateFullName, validatePassword, validateUsername };

