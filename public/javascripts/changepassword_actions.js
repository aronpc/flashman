
let check = function(input) {
  if (input.value != document.getElementById('password').value) {
    input.setCustomValidity('As senhas estão diferentes');
  } else {
    input.setCustomValidity('');
  }
};

(function() {
  'use strict';
  window.addEventListener('load', function() {
    let forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();
