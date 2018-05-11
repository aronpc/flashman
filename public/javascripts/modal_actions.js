const displayAlertMsg = function(res) {
  $('#frame-modal-alert .modal-dialog').removeClass(
    'modal-success modal-danger'
  );
  $('#frame-modal-alert .modal-dialog').addClass('modal-' + res.type);
  $('#frame-modal-alert .alert-message').html(res.message);
  $('#frame-modal-alert').modal('show');
};
