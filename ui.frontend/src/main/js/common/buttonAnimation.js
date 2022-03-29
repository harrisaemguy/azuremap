import './buttonAnimation.css';
import { getAfFieldId } from './generic';

// call this on input's initialize
export function applyAnimation(fld, ms) {
  let fldId = getAfFieldId(fld);
  let input = $(`#${fldId} button`);
  input.addClass('buttonA');
  input.click(function () {
    console.log('click....');
    var butn = $(this);
    butn.toggleClass('sending').blur().prop('disabled', true);

    setTimeout(function () {
      butn.removeClass('sending').blur().prop('disabled', false);
    }, 4500);
  });
}

export function applySpinA(fld, ms) {
  let fldId = getAfFieldId(fld);
  let input = $(`#${fldId} button`);
  input.addClass('spinA');
  input.click(function () {
    console.log('click....');
    var $t = $(this);
    $t.removeClass('button-default')
      .removeClass('button-medium')
      .removeClass('Button');
    var hasClass = $t.hasClass('done');
    if (!hasClass) {
      $(this).addClass('clicked');
      setTimeout(function () {
        $t.removeClass('clicked').attr(
          'class',
          'button-default button-medium Button spinA'
        );
      }, 5000);
    } else if (hasClass) {
      $t.removeClass('done').attr(
        'class',
        'button-default button-medium Button spinA'
      );
    }
  });
}
