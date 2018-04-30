let removeDeviceErrors = function (errors) {
  $("#deviceForm").find("p").remove();
  for (let key in errors) {
    $(errors[key].field).removeClass("red lighten-4");
  }
};

let renderDeviceErrors = function (errors) {
  for (let key in errors) {
    if (errors[key].messages.length > 0) {
      $(errors[key].field).addClass("red lighten-4");
      let message = "";
      errors[key].messages.forEach(function (msg) {
        message += msg + "<br />";
      });
      let element = "<p class=\"red-text\"><small>" + message + "</small></p>";
      $(errors[key].field).parent().after(element);
    }
  }
};

let validateIdField = function(value, length, errors) {
  if (value.length < 1) {
    errors.messages.push("Este campo é obrigatório");
  }
  else {
    if (value.length > length) {
      let l = length.toString();
      errors.messages.push("Este campo não pode ter mais de " + l + " caracteres");
    }
    if (!value.match(/^[a-zA-Z0-9\-\_\#\s]+$/)) {
      errors.messages.push(
        "Somente são aceitos: caracteres alfanuméricos, espaços, - e _"
      );
    }
  }
};

let validatePasswordField = function(value, length, errors) {
  if (value.length < 1) {
    errors.messages.push("Este campo é obrigatório");
  }
  else {
    if (value.length > length) {
      let l = length.toString();
      errors.messages.push("Este campo não pode ter mais de " + l + " caracteres");
    }
    if (!value.match(/^[a-zA-Z0-9\-\_\#\!\@\$\%\&\*\=\+\?]+$/)) {
      errors.messages.push(
        "Letras com acento, cedilha, e alguns caracteres especiais não são aceitos."
      );
    }
  }
};

let validateNewDevice = function () {
  $(".form-control").blur();  // Remove focus from form

  // Get form values
  let mac = $("#new_mac").val();
  let pppoe_user = $("#new_pppoe_user").val();
  let pppoe_password = $("#new_pppoe_pass").val();
  let ssid = $("#new_wifi_ssid").val();
  let password = $("#new_wifi_pass").val();
  let channel = $("#new_wifi_channel").val();

  // Initialize error structure
  let errors = {
    mac: {field: '#new_mac'},
    pppoe_user: {field: '#new_pppoe_user'},
    pppoe_password: {field: "#new_pppoe_pass"},
    ssid: {field: "#new_wifi_ssid"},
    password: {field: "#new_wifi_pass"},
    channel: {field: "#new_wifi_channel"}
  }
  for (let key in errors) {
    errors[key]['messages'] = [];
  }

  // Clean previous error values from DOM
  removeDeviceErrors(errors);

  // Validate MAC
  if (!mac.match(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/)) {
    errors.mac.messages.push("Endereço MAC inválido");
  }

  // Validate PPPoE user
  validateIdField(pppoe_user, 64, errors.pppoe_user);

  // Validate PPPoE password
  validatePasswordField(pppoe_password, 64, errors.pppoe_password);

  // Validate PPPoE user
  validateIdField(ssid, 32, errors.ssid);

  // Validate PPPoE password
  validatePasswordField(password, 64, errors.password);

  let hasNoErrors = function (key) {
    return errors[key].messages.length < 1;
  };

  if (Object.keys(errors).every(hasNoErrors)) {
    // If no errors present, send to backend
    return false;
  }
  else {
    // Else, render errors on form
    renderDeviceErrors(errors);
    return false;
  }
};

$(document).ready(function() {
  $("#deviceForm").submit(validateNewDevice);

  $("#new_mac").mask("HH:HH:HH:HH:HH:HH", {
    translation: {
      H: {pattern: /[A-Fa-f0-9]/}
    },
    onChange: function(mac) {
      $("#new_mac").val(mac.toUpperCase());
    }
  });
});
