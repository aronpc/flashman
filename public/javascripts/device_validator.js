(function() {
  let deviceValidator = (function () {
    let validateRegex = function(value, minlength, length, regex) {
      let valid = true;
      let err = [];

      if (value.length < minlength) {
        valid = false;
        err.push(0);
      }
      else {
        if (value.length > length) {
          valid = false;
          err.push(1);
        }
        if (!value.match(regex)) {
          valid = false;
          err.push(2);
        }
      }
      return {valid: valid, err: err};
    }

    let Validator = function() {};

    Validator.prototype.validateMac = function(mac) {
      return {
        valid: mac.match(/^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/),
        err: ["Endereço MAC inválido"]
      };
    };

    Validator.prototype.validateChannel = function(channel) {
      return {
        valid: ["1", "6", "11", "auto"].includes(channel),
        err: ["Somente são aceitos os valores 1, 6, 11 e auto"]
      };
    };

    Validator.prototype.validateUser = function(user) {
      const messages = [
        "Este campo é obrigatório",
        "Este campo não pode ter mais de 64 caracteres",
        "Somente são aceitos: caracteres alfanuméricos, espaços, - e _"
      ];
      let ret = validateRegex(user, 1, 64, /^[a-zA-Z0-9\-\_\#\s]+$/);
      ret.err = ret.err.map(ind => messages[ind]);
      return ret;
    };

    Validator.prototype.validatePassword = function(pass) {
      const messages = [
        "Este campo deve ter no mínimo 8 caracteres",
        "Este campo não pode ter mais de 64 caracteres",
        "Letras com acento, cedilha, e alguns caracteres especiais não são aceitos"
      ];
      let ret = validateRegex(pass, 8, 64, /^[a-zA-Z0-9\-\_\#\!\@\$\%\&\*\=\+\?]+$/);
      ret.err = ret.err.map(ind => messages[ind]);
      return ret;
    };

    Validator.prototype.validateSSID = function(ssid) {
      const messages = [
        "Este campo é obrigatório",
        "Este campo não pode ter mais de 32 caracteres",
        "Somente são aceitos: caracteres alfanuméricos, espaços, - e _"
      ];
      let ret = validateRegex(ssid, 1, 32, /^[a-zA-Z0-9\-\_\#\s]+$/);
      ret.err = ret.err.map(ind => messages[ind]);
      return ret;
    };

    Validator.prototype.validateWifiPassword = function(pass) {
      const messages = [
        "Este campo deve ter no mínimo 8 caracteres",
        "Este campo não pode ter mais de 64 caracteres",
        "Letras com acento, cedilha, e alguns caracteres especiais não são aceitos"
      ];
      let ret = validateRegex(pass, 8, 64, /^[a-zA-Z0-9\-\_\#\!\@\$\%\&\*\=\+\?]+$/);
      ret.err = ret.err.map(ind => messages[ind]);
      return ret;
    };

    return Validator;
  })();

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = deviceValidator;
  }
  else {
    window.Validator = deviceValidator;
  }

})();
