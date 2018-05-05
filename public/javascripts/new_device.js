let removeDeviceErrors = function(errors) {
  $('#deviceForm').find('p').remove();
  for (let key in errors) {
    $(errors[key].field).removeClass('red lighten-4');
  }
};

let renderDeviceErrors = function(errors) {
  for (let key in errors) {
    if (errors[key].messages.length > 0) {
      $(errors[key].field).addClass('red lighten-4');
      let message = '';
      errors[key].messages.forEach(function(msg) {
        message += msg + '<br />';
      });
      let element = '<p class="red-text"><small>' + message + '</small></p>';
      $(errors[key].field).parent().after(element);
    }
  }
};

let validateNewDevice = function() {
  $('.form-control').blur(); // Remove focus from form
  let validator = new Validator();

  // Get form values
  let pppoe = $('#new_connect_type').val() === 'PPPoE';
  let mac = $('#new_mac').val();
  let pppoe_user = $('#new_pppoe_user').val();
  let pppoe_password = $('#new_pppoe_pass').val();
  let ssid = $('#new_wifi_ssid').val();
  let password = $('#new_wifi_pass').val();
  let channel = $('#new_wifi_channel').val();
  let external_reference_type = $('#new_ext_ref_type_selected').html();
  let external_reference_data = $('#new_external_reference').val();

  // Initialize error structure
  let errors = {
    mac: {field: '#new_mac'},
    pppoe_user: {field: '#new_pppoe_user'},
    pppoe_password: {field: '#new_pppoe_pass'},
    ssid: {field: '#new_wifi_ssid'},
    password: {field: '#new_wifi_pass'},
    channel: {field: '#new_wifi_channel'},
  };
  for (let key in errors) {
    errors[key]['messages'] = [];
  }

  // Clean previous error values from DOM
  removeDeviceErrors(errors);

  let genericValidate = function(value, func, errors) {
    let valid_field = func(value);
    if (!valid_field.valid) {
      errors.messages = valid_field.err;
    }
  };

  // Validate fields
  genericValidate(mac, validator.validateMac, errors.mac);
  if (pppoe) {
    genericValidate(pppoe_user, validator.validateUser, errors.pppoe_user);
    genericValidate(pppoe_password, validator.validatePassword, errors.pppoe_password);
  }
  genericValidate(ssid, validator.validateSSID, errors.ssid);
  genericValidate(password, validator.validateWifiPassword, errors.password);
  genericValidate(channel, validator.validateChannel, errors.channel);

  let hasNoErrors = function(key) {
    return errors[key].messages.length < 1;
  };

  if (Object.keys(errors).every(hasNoErrors)) {
    // If no errors present, send to backend
    let data = {'content': {
      'mac_address': mac,
      'pppoe_user': (pppoe) ? pppoe_user : '',
      'pppoe_password': (pppoe) ? pppoe_password : '',
      'wifi_ssid': ssid,
      'wifi_password': password,
      'wifi_channel': channel,
      'external_reference': {
        kind: external_reference_type,
        data: external_reference_data,
      },
    }};

    $.ajax({
      type: 'POST',
      url: '/devicelist/create',
      dataType: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function(resp) {
        if ('errors' in resp) {
          let keyToError = {
            mac: errors.mac,
            pppoe_user: errors.pppoe_user,
            pppoe_password: errors.pppoe_password,
            ssid: errors.ssid,
            password: errors.password,
            channel: errors.channel,
          };
          resp.errors.forEach(function(pair) {
            let key = Object.keys(pair)[0];
            console.log(key);
            keyToError[key].messages.push(pair[key]);
          });
          renderDeviceErrors(errors);
        } else {
          location.reload();
        }
      },
    });
  } else {
    // Else, render errors on form
    renderDeviceErrors(errors);
  }
  return false;
};

$(document).ready(function() {
  $('#deviceForm').submit(validateNewDevice);

  $('#new_mac').mask('HH:HH:HH:HH:HH:HH', {
    translation: {
      H: {pattern: /[A-Fa-f0-9]/},
    },
    onChange: function(mac) {
      $('#new_mac').val(mac.toUpperCase());
    },
  });

  $('#new_connect_type').change(function() {
    if ($('#new_connect_type').val() === 'PPPoE') {
      $('#new_pppoe_user').parent().show();
      $('#new_pppoe_pass').parent().show();
    } else {
      $('#new_pppoe_user').parent().hide();
      $('#new_pppoe_pass').parent().hide();
    }
  });

  $('#new_pppoe_user').parent().hide();
  $('#new_pppoe_pass').parent().hide();
});
